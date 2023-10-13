import React, { useState, useEffect } from "react";
import hljs from "highlight.js";
import "./tailwind.output.css";
import "./styles.css";
import "highlight.js/styles/atom-one-dark.css";

function DirectoryPickerApp() {
  const [directoryTree, setDirectoryTree] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  async function handleDirectoryPick() {
    try {
      const handle = await showDirectoryPicker();
      const root = await processHandler(handle);
      setDirectoryTree([root]);
    } catch (error) {
      alert("访问失败"); // 用户拒绝访问
    }
  }

  async function processHandler(handle, isFirstLevel = false) {
    if (handle.kind === "file") {
      return handle;
    }

    const entries = [];
    const iter = await handle.entries();

    for await (const info of iter) {
      const subHandle = await processHandler(info[1], false); // 不是第一层文件夹
      entries.push(subHandle);
    }

    handle.entries = entries;

    if (isFirstLevel) {
      handle.isExpanded = true; // 第一层文件夹默认展开
    }

    return handle;
  }
  useEffect(() => {
    // Check if the root folder contains readable files
    if (directoryTree && directoryTree.length > 0) {
      const root = directoryTree[0];
      const firstFile = findFirstReadableFile(root);

      if (firstFile) {
        handleFileClick(firstFile);
      }
    }
  }, [directoryTree]);

  function handleFileClick(file) {
    setSelectedFile(file);
  }

  function toggleFolder(folder) {
    folder.isExpanded = !folder.isExpanded;
    setDirectoryTree([...directoryTree]);
  }

  useEffect(() => {
    if (selectedFile) {
      selectedFile.getFile().then((file) => {
        file.text().then((content) => {
          const highlightedCode = hljs.highlightAuto(content).value;
          document.getElementById(
            "file-preview"
          ).innerHTML = `<pre><code class="language-javascript">${highlightedCode}</code></pre>`;
        });
      });
    } else {
      document.getElementById("file-preview").textContent =
        "请打开本地文件夹并预览文件";
    }
  }, [selectedFile]);

  function renderTreeItem(item, key) {
    return (
      <div key={key}>
        {item.kind === "directory" ? (
          <div>
            <button
              onClick={() => toggleFolder(item)}
              className={`flex items-center space-x-2 ${
                selectedFile === item ? "bg-blue-200" : ""
              }`}
            >
              <i className={`fa-folder text-gray-500`} />
              {item.isExpanded ? "[-]" : "[+]"}
              {item.name}
            </button>
            {item.isExpanded && (
              <div style={{ marginLeft: "20px" }}>
                {item.entries.map((child, index) =>
                  renderTreeItem(child, index)
                )}
              </div>
            )}
          </div>
        ) : (
          <div>
            <button
              onClick={() => handleFileClick(item)}
              className={`flex items-center space-x-2 ${
                selectedFile === item ? "bg-blue-200" : ""
              }`}
            >
              <i className="fa-file text-gray-500" />
              {item.name}
            </button>
          </div>
        )}
      </div>
    );
  }

  useEffect(() => {
    // Check if the root folder contains readable files
    if (directoryTree && directoryTree.length > 0) {
      const root = directoryTree[0];
      const firstFile = findFirstReadableFile(root);

      if (firstFile) {
        handleFileClick(firstFile);
      }
    }
  }, [directoryTree]);

  function findFirstReadableFile(folder) {
    if (folder.entries && folder.entries.length > 0) {
      for (const item of folder.entries) {
        if (item.kind === "file") {
          return item;
        } else if (item.entries && item.entries.length > 0) {
          const firstFile = findFirstReadableFile(item);
          if (firstFile) {
            return firstFile;
          }
        }
      }
    }

    return null;
  }

  return (
    <div className="file-browser p-4 flex">
      <div className="file-tree flex-1 p-2 border-r border-gray-200">
        <button
          onClick={handleDirectoryPick}
          className="bg-blue-500 text-white px-2 py-1 rounded"
        >
          打开文件夹
        </button>
        {directoryTree &&
          directoryTree.map((root, index) => renderTreeItem(root, index))}
      </div>
      <div
        className="file-preview flex-2 p-4 bg-gray-100"
        id="file-preview"
      ></div>
    </div>
  );
}

export default DirectoryPickerApp;
