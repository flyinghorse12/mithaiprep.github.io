// src/components/UPSCProfile.jsx
import React, { useEffect, useRef, useState } from "react";
import supabase, { getProviderToken, saveFileMetadata } from "../supabase"; // note: supabase exports helper functions above
// If your project structure differs, adjust the import path accordingly.
import "../assets/scss/UPSCProfile.scss";


const DRIVE_API = "https://www.googleapis.com/drive/v3";
const UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";

/* ---------- Drive helpers ---------- */

async function findFolder(accessToken, name, parentId = null) {
  const q = parentId
    ? `mimeType='application/vnd.google-apps.folder' and name='${name.replace(/'/g, "\\'")}' and '${parentId}' in parents and trashed=false`
    : `mimeType='application/vnd.google-apps.folder' and name='${name.replace(/'/g, "\\'")}' and trashed=false and 'root' in parents`;
  const url = `${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id,name,parents)`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Drive findFolder failed: ${res.status} ${txt}`);
  }
  const json = await res.json();
  return json.files?.[0] ?? null;
}

async function createFolder(accessToken, name, parentId = null) {
  const body = { name, mimeType: "application/vnd.google-apps.folder" };
  if (parentId) body.parents = [parentId];
  const res = await fetch(`${DRIVE_API}/files?fields=id,name,parents`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Drive createFolder failed: ${res.status} ${txt}`);
  }
  return res.json();
}

async function ensureFolderPath(accessToken, pathArray) {
  // pathArray = ["MithaiPrep", "UPSC Profile", "<submodule>"]
  let parentId = null;
  let createdPath = [];
  for (const seg of pathArray) {
    const found = await findFolder(accessToken, seg, parentId);
    if (found) {
      parentId = found.id;
      createdPath.push(seg);
    } else {
      const created = await createFolder(accessToken, seg, parentId);
      parentId = created.id;
      createdPath.push(seg);
    }
  }
  return { id: parentId, path: createdPath.join("/") };
}

async function uploadFileToDrive(accessToken, file, parentId) {
  const metadata = { name: file.name, parents: [parentId] };
  const boundary = "-------314159265358979323846";
  const delim = `\r\n--${boundary}\r\n`;
  const closeDelim = `\r\n--${boundary}--`;

  const reader = new FileReader();
  const buffer = await new Promise((resolve, reject) => {
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });

  const metaPart = `Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
  const fileHeader = `Content-Type: ${file.type || "application/octet-stream"}\r\n\r\n`;

  const bodyBlob = new Blob([delim, metaPart, delim, fileHeader, new Uint8Array(buffer), closeDelim]);

  const res = await fetch(`${UPLOAD_API}/files?uploadType=multipart&fields=id,name,size,mimeType,webViewLink`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": `multipart/related; boundary=${boundary}` },
    body: bodyBlob,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Drive upload failed: ${res.status} ${txt}`);
  }
  return res.json();
}

async function listFilesInFolder(accessToken, folderId) {
  const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
  const url = `${DRIVE_API}/files?q=${q}&fields=files(id,name,mimeType,size,webViewLink,createdTime)`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Drive list files failed: ${res.status} ${txt}`);
  }
  const json = await res.json();
  return json.files || [];
}

/* ---------- Component ---------- */

export default function UPSCProfile({ moduleName = "UPSC Profile", submoduleName = "" }) {
  const [user, setUser] = useState(null);
  const [folderPath, setFolderPath] = useState("");
  const [folderId, setFolderId] = useState(null);
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    async function loadUser() {
      try {
        if (supabase?.auth?.getUser) {
          const { data } = await supabase.auth.getUser();
          setUser(data?.user ?? null);
        } else if (supabase?.auth?.user) {
          setUser(supabase.auth.user() ?? null);
        }
      } catch (e) {
        console.warn("UPSCProfile: loadUser err", e);
      }
    }
    loadUser();
  }, []);

  function computePathArray() {
    const arr = ["MithaiPrep", moduleName || "UPSC Profile"];
    if (submoduleName) arr.push(submoduleName);
    return arr;
  }

  async function ensureAndLoad() {
    setLoading(true);
    setStatus("Preparing Drive folder...");
    try {
      const token = await getProviderToken();
      if (!token) throw new Error("No Google provider token. Re-login with Drive scope.");
      const pathArray = computePathArray();
      const { id, path } = await ensureFolderPath(token, pathArray);
      setFolderId(id);
      setFolderPath(path);
      setStatus("Listing files...");
      const fl = await listFilesInFolder(token, id);
      setFiles(fl);
      setStatus(`Loaded ${fl.length} files`);
    } catch (err) {
      console.error(err);
      setStatus("Error: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) ensureAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, moduleName, submoduleName]);

  async function handleUpload(e) {
    e?.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return setStatus("Please select a PDF or image.");
    setLoading(true);
    setStatus("Uploading...");
    try {
      const token = await getProviderToken();
      if (!token) throw new Error("No provider token available. Re-login with Drive scope.");
      const pathArray = computePathArray();
      const { id } = await ensureFolderPath(token, pathArray);
      const uploaded = await uploadFileToDrive(token, file, id);

      // Save metadata to supabase
      if (!user) throw new Error("User not found");
      await saveFileMetadata({
        user_id: user.id,
        module: moduleName,
        sub_module: submoduleName || null,
        google_file_id: uploaded.id,
        file_name: uploaded.name,
        mime_type: uploaded.mimeType ?? file.type,
      });

      setStatus("Uploaded and saved metadata.");
      const fl = await listFilesInFolder(token, id);
      setFiles(fl);
    } catch (err) {
      console.error("handleUpload err", err);
      setStatus("Upload failed: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  }

  async function handleView(file) {
    setLoading(true);
    setStatus("Fetching file...");
    try {
      const token = await getProviderToken();
      if (!token) throw new Error("No provider token.");
      const url = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Failed to fetch file: ${res.status} ${txt}`);
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
      setStatus("");
    } catch (err) {
      console.error(err);
      setStatus("Could not open file: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  }

return (
  <div className="upsc-profile">
      <h2>UPSC Profile</h2>
      <p>
        Files uploaded here are saved to your Google Drive under: <strong>{`MithaiPrep / ${moduleName}${submoduleName ? ' / ' + submoduleName : ''}`}</strong>
      </p>

      <div style={{ marginTop: 12, marginBottom: 12 }}>
        <div style={{ marginBottom: 8 }}><strong>Drive path:</strong> {folderPath || "—"}</div>

        <form onSubmit={handleUpload} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input ref={fileRef} type="file" accept="application/pdf,image/*" />
          <button type="submit" disabled={loading}>Upload</button>
          <button type="button" onClick={ensureAndLoad} disabled={loading}>Refresh</button>
        </form>

        <div style={{ marginTop: 12 }}>
          <div><strong>Files in folder</strong></div>
          <div style={{ marginTop: 8 }}>
            {files.length === 0 ? <div style={{ color: "#666" }}>No files yet</div> :
              files.map(f => (
                <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 8, background: "#f6f9fc", borderRadius: 8, marginTop: 8 }}>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>{f.name}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => handleView(f)} disabled={loading}>Open</button>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        <div style={{ marginTop: 10, color: "#666" }}>{status}</div>
      </div>
    </div>
  );
}

