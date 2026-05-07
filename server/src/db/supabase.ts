import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const isProduction = Boolean(supabaseUrl && supabaseKey);

export const supabase = isProduction ? createClient(supabaseUrl!, supabaseKey!) : null;

const mockProfiles = new Map<string, any>();
const mockMatchHistory: any[] = [];

export async function recordMatchHistory(winnerId: string, mode: string, playerIds: string[]) {
  if (isProduction && supabase) {
    await supabase.from('match_history').insert([{ winner_id: winnerId, mode, players: playerIds, timestamp: new Date().toISOString() }]);
    for (const pId of playerIds) {
      await supabase.rpc('update_player_stats', { player_id: pId, is_winner: pId === winnerId });
    }
  } else {
    console.log(`[MOCK DB] Recording Match History. Winner: ${winnerId}, Mode: ${mode}`);
    mockMatchHistory.push({ winnerId, mode, playerIds, timestamp: new Date().toISOString() });
    for (const pId of playerIds) {
      if (!mockProfiles.has(pId)) mockProfiles.set(pId, { id: pId, name: `Player ${pId}`, total_wins: 0, favorite_mode: mode });
      if (pId === winnerId) { const p = mockProfiles.get(pId); if (p) p.total_wins += 1; }
    }
  }
}

export async function getGlobalLeaderboard() {
  if (isProduction && supabase) {
    const { data, error } = await supabase.from('profiles').select('id, name, total_wins, favorite_mode').order('total_wins', { ascending: false }).limit(10);
    if (error) throw error;
    return data || [];
  } else {
    const allProfiles = Array.from(mockProfiles.values());
    allProfiles.sort((a, b) => b.total_wins - a.total_wins);
    return allProfiles.slice(0, 10);
  }
}
