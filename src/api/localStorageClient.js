function createEntityStore(storageKey) {
  function getAll() {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  }

  function saveAll(items) {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }

  function sortItems(items, sortField) {
    if (!sortField) return items;
    const desc = sortField.startsWith('-');
    const field = desc ? sortField.slice(1) : sortField;
    return [...items].sort((a, b) => {
      const aVal = a[field] ?? '';
      const bVal = b[field] ?? '';
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return desc ? -cmp : cmp;
    });
  }

  return {
    list(sortField) {
      return Promise.resolve(sortItems(getAll(), sortField));
    },

    filter(criteria, sortField) {
      const items = getAll().filter(item =>
        Object.entries(criteria).every(([key, val]) => String(item[key]) === String(val))
      );
      return Promise.resolve(sortItems(items, sortField));
    },

    create(data) {
      const items = getAll();
      const record = {
        ...data,
        id: crypto.randomUUID(),
        created_date: new Date().toISOString(),
      };
      items.push(record);
      saveAll(items);
      return Promise.resolve(record);
    },

    update(id, partialData) {
      const items = getAll();
      const index = items.findIndex(item => item.id === id);
      if (index === -1) return Promise.reject(new Error(`Record ${id} not found`));
      items[index] = { ...items[index], ...partialData };
      saveAll(items);
      return Promise.resolve(items[index]);
    },

    delete(id) {
      const items = getAll();
      const filtered = items.filter(item => item.id !== id);
      saveAll(filtered);
      return Promise.resolve();
    },
  };
}

export const localDB = {
  entities: {
    Project: createEntityStore('vf_projects'),
    Feedback: createEntityStore('vf_feedbacks'),
  },
};
