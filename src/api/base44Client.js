import { supabase } from './supabaseClient';

function createEntityStore(tableName) {
  return {
    async list(sortField) {
      let query = supabase.from(tableName).select('*');
      if (sortField) {
        const desc = sortField.startsWith('-');
        const column = desc ? sortField.slice(1) : sortField;
        query = query.order(column, { ascending: !desc });
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },

    async filter(criteria, sortField) {
      let query = supabase.from(tableName).select('*');
      for (const [key, value] of Object.entries(criteria)) {
        query = query.eq(key, value);
      }
      if (sortField) {
        const desc = sortField.startsWith('-');
        const column = desc ? sortField.slice(1) : sortField;
        query = query.order(column, { ascending: !desc });
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },

    async create(record) {
      const { data, error } = await supabase
        .from(tableName)
        .insert(record)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, partial) {
      const { data, error } = await supabase
        .from(tableName)
        .update(partial)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  };
}

async function uploadFile({ file }) {
  const ext = file.name.split('.').pop();
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from('uploads')
    .upload(path, file);
  if (error) throw error;

  const { data } = supabase.storage
    .from('uploads')
    .getPublicUrl(path);

  return { file_url: data.publicUrl };
}

export const base44 = {
  entities: {
    Project: createEntityStore('projects'),
    Feedback: createEntityStore('feedbacks'),
  },
  integrations: {
    Core: { UploadFile: uploadFile },
  },
};
