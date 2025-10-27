// src/components/UPSCProfile.jsx
import React, { useEffect, useRef, useState } from "react";
import supabase, { getProviderToken, saveFileMetadata } from "../supabase";
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
  if (!res.ok) throw new Error(`Drive findFolder failed: ${res.status}`);
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
  if (!res.ok) throw new Error(`Drive createFolder failed: ${res.status}`);
  return res.json();
}

async function ensureFolderPath(accessToken, pathArray) {
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
  if (!res.ok) throw new Error(`Drive upload failed: ${res.status}`);
  return res.json();
}

async function listFilesInFolder(accessToken, folderId) {
  const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
  const url = `${DRIVE_API}/files?q=${q}&fields=files(id,name,mimeType,size,webViewLink,createdTime)`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Drive list files failed: ${res.status}`);
  const json = await res.json();
  return json.files || [];
}

/* ---------- Component ---------- */

export default function UPSCProfile({ moduleName = "UPSC Profile", submoduleName = "" }) {
  const [user, setUser] = useState(null);
  const [folderPath, setFolderPath] = useState("");
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    async function loadUser() {
      try {
        const { data } = await supabase.auth.getUser();
        setUser(data?.user ?? null);
      } catch (e) {
        console.warn("UPSCProfile: loadUser err", e);
      }
    }
    loadUser();
  }, []);

  function computePathArray() {
    const arr = ["MithaiPrep", moduleName];
    if (submoduleName) arr.push(submoduleName);
    return arr;
  }

  async function ensureAndLoad() {
    setLoading(true);
    setStatus("Preparing Drive folder...");
    try {
      const token = await getProviderToken();
      const { id, path } = await ensureFolderPath(token, computePathArray());
      setFolderPath(path);
      setStatus("Listing files...");
      const fl = await listFilesInFolder(token, id);
      setFiles(fl);
      setStatus(`Loaded ${fl.length} files`);
    } catch (err) {
      console.error(err);
      setStatus("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return setStatus("Please select a PDF or image.");
    setLoading(true);
    setStatus("Uploading...");
    try {
      const token = await getProviderToken();
      const { id } = await ensureFolderPath(token, computePathArray());
      const uploaded = await uploadFileToDrive(token, file, id);

      await saveFileMetadata({
        user_id: user?.id,
        module: moduleName,
        sub_module: submoduleName || null,
        google_file_id: uploaded.id,
        file_name: uploaded.name,
        mime_type: uploaded.mimeType ?? file.type,
      });

      const fl = await listFilesInFolder(token, id);
      setFiles(fl);
      setStatus("Uploaded and saved metadata.");
    } catch (err) {
      setStatus("Upload failed: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="upsc-profile-container">
      <div className="upsc-profile">
        <h2>UPSC Profile</h2>
        <p>
          Files uploaded here are saved to your Google Drive under:{" "}
          <strong>{`MithaiPrep / ${moduleName}${submoduleName ? " / " + submoduleName : ""}`}</strong>
        </p>

        <div className="drive-info">
          <div><strong>Drive path:</strong> {folderPath || "—"}</div>

          <form className="upload-form" onSubmit={handleUpload}>
            <input ref={fileRef} type="file" accept="application/pdf,image/*" />
            <button type="submit" disabled={loading}>Upload</button>
            <button type="button" onClick={ensureAndLoad} disabled={loading}>Refresh</button>
          </form>

          <div className="file-list">
            <div><strong>Files in folder</strong></div>
            {files.length === 0 ? (
              <div className="no-files">No files yet</div>
            ) : (
              files.map(f => (
                <div key={f.id} className="file-item">
                  <span className="file-name">{f.name}</span>
                  <button onClick={() => window.open(f.webViewLink, "_blank")}>Open</button>
                </div>
              ))
            )}
          </div>

          <div className="status-text">{status}</div>
        </div>
      </div>
    </div>
  );
}

