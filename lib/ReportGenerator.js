import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { supabase } from './supabase';
import { Alert } from 'react-native';

// Helper to normalize room names for matching
const normalizeRoom = (roomString) => {
  if (!roomString) return 'unknown';
  return roomString.toString().toLowerCase()
    .replace(/room/g, '').replace(/class/g, '')
    .replace(/_/g, '').replace(/-/g, '').replace(/\s/g, '').trim();
};

export const generateAndPrintReport = async (allUsers) => {
  try {
    // 1. Define Date Ranges
    const now = new Date();
    
    // Start of Today (00:00:00)
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    
    // Start of Month (1st day)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // 2. Fetch Logs for the entire Month
    // We fetch everything from the start of the month until now.
    // We can filter "Today" from this same dataset to save bandwidth.
    const { data: logs, error } = await supabase
      .from('noise_logs')
      .select('room_id, db_level, created_at')
      .gte('created_at', startOfMonth)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!logs || logs.length === 0) {
      Alert.alert("No Data", "No noise logs found for this month.");
      return;
    }

    // 3. Process Data
    const dailyStats = {};
    const monthlyStats = {};

    logs.forEach(log => {
      const roomKey = log.room_id;
      const logDate = log.created_at;

      // --- Process Monthly (All fetched logs) ---
      if (!monthlyStats[roomKey]) monthlyStats[roomKey] = { count: 0, maxDb: 0 };
      monthlyStats[roomKey].count += 1;
      if (log.db_level > monthlyStats[roomKey].maxDb) monthlyStats[roomKey].maxDb = log.db_level;

      // --- Process Daily (Only logs from today) ---
      if (logDate >= startOfDay) {
        if (!dailyStats[roomKey]) dailyStats[roomKey] = { count: 0, maxDb: 0 };
        dailyStats[roomKey].count += 1;
        if (log.db_level > dailyStats[roomKey].maxDb) dailyStats[roomKey].maxDb = log.db_level;
      }
    });

    // 4. Map to Teachers and Sort by Frequency
    const formatStats = (statsObj) => {
      return Object.keys(statsObj)
        .map(roomId => {
          // Find teacher
          const teacher = allUsers.find(u => 
            u.role === 'Teacher' && normalizeRoom(u.room_num) === normalizeRoom(roomId)
          );
          return {
            room: roomId,
            teacherName: teacher ? teacher.name : 'Unassigned',
            count: statsObj[roomId].count,
            maxDb: statsObj[roomId].maxDb.toFixed(1)
          };
        })
        .sort((a, b) => b.count - a.count); // Highest noise count first
    };

    const dailyReportData = formatStats(dailyStats);
    const monthlyReportData = formatStats(monthlyStats);

    // 5. Generate HTML
    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 20px; }
            h1 { color: #059669; text-align: center; }
            h2 { border-bottom: 2px solid #059669; padding-bottom: 5px; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background-color: #f3f4f6; text-align: left; padding: 10px; border: 1px solid #ddd; }
            td { padding: 10px; border: 1px solid #ddd; }
            .high-risk { color: #dc2626; font-weight: bold; }
            .meta { text-align: center; color: #666; font-size: 12px; margin-bottom: 30px; }
          </style>
        </head>
        <body>
          <h1>NPMS Noise Report</h1>
          <p class="meta">Generated on: ${now.toLocaleString()}</p>

          <h2>📅 Today's Report (${now.toDateString()})</h2>
          ${dailyReportData.length === 0 ? '<p>No noise alerts detected today.</p>' : `
            <table>
              <tr>
                <th>Room</th>
                <th>Assigned Teacher</th>
                <th>Alert Frequency</th>
                <th>Max Volume</th>
              </tr>
              ${dailyReportData.map(item => `
                <tr>
                  <td>${item.room}</td>
                  <td>${item.teacherName}</td>
                  <td class="${item.count > 5 ? 'high-risk' : ''}">${item.count} times</td>
                  <td>${item.maxDb} dB</td>
                </tr>
              `).join('')}
            </table>
          `}

          <h2>bar_chart Month to Date (${now.toLocaleString('default', { month: 'long' })})</h2>
           ${monthlyReportData.length === 0 ? '<p>No noise alerts detected this month.</p>' : `
            <table>
              <tr>
                <th>Room</th>
                <th>Assigned Teacher</th>
                <th>Alert Frequency</th>
                <th>Max Volume</th>
              </tr>
              ${monthlyReportData.map(item => `
                <tr>
                  <td>${item.room}</td>
                  <td>${item.teacherName}</td>
                  <td class="${item.count > 20 ? 'high-risk' : ''}">${item.count} times</td>
                  <td>${item.maxDb} dB</td>
                </tr>
              `).join('')}
            </table>
          `}
        </body>
      </html>
    `;

    // 6. Print/Share
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });

  } catch (error) {
    console.log(error);
    Alert.alert("Report Error", "Failed to generate report.");
  }
};