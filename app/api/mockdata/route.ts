// app/api/mockdata/route.ts
import { supabase } from '../../../lib/supabase';

interface StockData {
  id: number;
  cashtag: string;
  prev_open: number;
  prev_eod: number;
  latest_price: number;
  chng: number;
  trend: number[];
}

interface SupabaseRow {
  data: StockData[] | string;
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('frontend_timeseries_data')
      .select('data');

    if (error) {
      console.error('Error fetching data from Supabase:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch data' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!data || data.length === 0) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const allRecords = data.flatMap((row: SupabaseRow) => {
      const parsedData = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
      return parsedData as StockData[];
    });

    const transformedData = allRecords.map((item: StockData) => ({
      id: item.id,
      cashtag: item.cashtag,
      prev_open: item.prev_open,
      prev_eod: item.prev_eod,
      latest_price: item.latest_price,
      chng: item.chng,
      trend: item.trend,
    }));

    return new Response(JSON.stringify(transformedData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}