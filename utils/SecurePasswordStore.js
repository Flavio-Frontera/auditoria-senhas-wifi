import * as SecureStore from 'expo-secure-store';

const INDEX_KEY = 'saved_passwords_index';

function entryKey(id) {
  return `saved_password_${id}`;
}

async function getIndex() {
  try {
    const raw = await SecureStore.getItemAsync(INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.log('Erro ao ler índice de senhas:', error);
    return [];
  }
}

async function setIndex(ids) {
  await SecureStore.setItemAsync(INDEX_KEY, JSON.stringify(ids));
}

export async function getAllSavedPasswords() {
  const ids = await getIndex();
  const entries = await Promise.all(
    ids.map(async (id) => {
      try {
        const raw = await SecureStore.getItemAsync(entryKey(id));
        return raw ? JSON.parse(raw) : null;
      } catch (error) {
        console.log(`Erro ao ler senha ${id}:`, error);
        return null;
      }
    })
  );
  return entries.filter(Boolean);
}

export async function addSavedPassword(entry) {
  const id = entry.id || Date.now().toString();
  const fullEntry = { ...entry, id };

  await SecureStore.setItemAsync(entryKey(id), JSON.stringify(fullEntry));

  const ids = await getIndex();
  await setIndex([id, ...ids.filter((existingId) => existingId !== id)]);

  return fullEntry;
}

export async function deleteSavedPassword(id) {
  await SecureStore.deleteItemAsync(entryKey(id));
  const ids = await getIndex();
  await setIndex(ids.filter((existingId) => existingId !== id));
}

export async function replaceAllSavedPasswords(entries) {
  const currentIds = await getIndex();
  await Promise.all(currentIds.map((id) => SecureStore.deleteItemAsync(entryKey(id))));

  const newIds = [];
  for (const entry of entries) {
    // SecureStore só aceita chaves com letras, números, ".", "-" e "_"
    const rawId = String(entry.id || `${Date.now()}_${newIds.length}`);
    const id = rawId.replace(/[^A-Za-z0-9._-]/g, '_');
    await SecureStore.setItemAsync(entryKey(id), JSON.stringify({ ...entry, id }));
    newIds.push(id);
  }
  await setIndex(newIds);
}

export async function clearAllSavedPasswords() {
  const ids = await getIndex();
  await Promise.all(ids.map((id) => SecureStore.deleteItemAsync(entryKey(id))));
  await SecureStore.deleteItemAsync(INDEX_KEY);
}