import { supabase } from '../lib/supabase';

export const uploadFile = async (file: File, path: string): Promise<{ publicUrl: string | null; error: string | null }> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return { publicUrl: null, error: error.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    return { publicUrl: publicUrlData.publicUrl, error: null };

  } catch (error) {
    console.error('Unexpected error during file upload:', error);
    return { publicUrl: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};