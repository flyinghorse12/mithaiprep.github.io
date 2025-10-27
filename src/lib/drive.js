// src/lib/drive.js
// Lightweight helper to create folders, upload files and list files in Google Drive
// Uses the user's Google access token retrieved from Supabase session/provider.

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';

async function getAccessToken(supabase) {
  // supabase.auth.getSession() or getUserSession - adjust to your supabase version
  // This function returns the Google provider access token (short lived).
  // NOTE: provider_token is present only if you logged in via google and Supabase returns it.
  const { data: { session }, error } = await supabase.auth.getSession?.() ?? { data: { session: null } };

  // fallback for older versions
  if (!session) {
    const { data, error: gErr } = await supabase.auth.getSession();
    if (gErr) throw gErr;
    return data?.session?.provider_token ?? data?.session?.access_token ?? null;
  }

  return session?.provider_token ?? session?.access_token ?? null;
}

function buildFolderQuery(name, parentId) {
  // q param for searching for a folder with name and parent
  const nameEsc = name.replace(/'/g, "\\'");
  if (parentId) {
    return `mimeType='application/vnd.google-apps.folder' and name='${nameEsc}' and '${parentId}' in parents and trashed=false`;
  } else {
    return `mimeType='application/vnd.google-apps.folder' and name='${nameEsc}' and trashed=false and 'root' in parents`;
  }
}

async function findFolder(accessToken, name, parentId = null) {
  const q = encodeURIComponent(buildFolderQuery(name, parentId));
  const url = `${DRIVE_API}/files?q=${q}&fields=files(id,name,parents)`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Drive findFolder failed: ${res.status} ${text}`);
  }
  const json = await res.json();
  return json.files?.[0] ?? null;
}

async function createFolder(accessToken, name, parentId = null) {
  const metadata = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) metadata.parents = [parentId];

  const res = await fetch(`${DRIVE_API}/files?fields=id,name,parents`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Drive createFolder failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function ensureFolderPath(accessToken, pathArray) {
  // pathArray = ["Mithaiprep", "UPSC Profile", "Region", "Kolkata"]
  // returns final folder metadata { id, name, parents }
  let parentId = null; // root
  let createdPath = [];
  for (const segment of pathArray) {
    const found = await findFolder(accessToken, segment, parentId);
    if (found) {
      parentId = found.id;
      createdPath.push(segment);
    } else {
      const created = await createFolder(accessToken, segment, parentId);
      parentId = created.id;
      createdPath.push(segment);
    }
  }
  return { id: parentId, path: createdPath.join('/') };
}

// Upload file via multipart/related (metadata + file)
async function uploadFileToDrive(accessToken, file, parentId, progressCallback) {
  // file: File object from input
  const metadata = {
    name: file.name,
    parents: [parentId],
  };

  const boundary = '-------314159265358979323846';
  const delim = `\r\n--${boundary}\r\n`;
  const closeDelim = `\r\n--${boundary}--`;

  const reader = new FileReader();

  const fileData = await new Promise((resolve, reject) => {
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });

  // Build multipart body as Blob
  const metaPart = `Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
  const fileHeader = `Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`;

  // Assemble as Blob
  const bodyBlob = new Blob([delim, metaPart, delim, fileHeader, new Uint8Array(fileData), closeDelim]);

  const res = await fetch(`${UPLOAD_API}/files?uploadType=multipart&fields=id,name,size,mimeType,webViewLink`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: bodyBlob,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Drive upload failed: ${res.status} ${text}`);
  }
  return res.json(); // contains id, name, size, mimeType, webViewLink (may require file visibility)
}

// list files in a folder (owned by app/user)
async function listFilesInFolder(accessToken, folderId) {
  const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
  const url = `${DRIVE_API}/files?q=${q}&fields=files(id,name,mimeType,size,webViewLink,createdTime)`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Drive list files failed: ${res.status} ${text}`);
  }
  const json = await res.json();
  return json.files || [];
}

export {
  getAccessToken,
  ensureFolderPath,
  uploadFileToDrive,
  listFilesInFolder,
};

