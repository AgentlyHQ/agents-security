package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
)

type ScanRequest struct {
	Content string `json:"content"`
}

func handleScan(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ScanRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Content == "" {
		http.Error(w, "Content is required", http.StatusBadRequest)
		return
	}

	tmpDir, err := os.MkdirTemp("", "gitleaks-scan-*")
	if err != nil {
		http.Error(w, "Failed to create temp dir", http.StatusInternalServerError)
		return
	}
	defer os.RemoveAll(tmpDir)

	contentFile := filepath.Join(tmpDir, "content.txt")
	if err := os.WriteFile(contentFile, []byte(req.Content), 0644); err != nil {
		http.Error(w, "Failed to write temp file", http.StatusInternalServerError)
		return
	}

	reportFile := filepath.Join(tmpDir, "report.json")
	cmd := exec.Command("gitleaks", "detect",
		"--source", tmpDir,
		"--report-format", "json",
		"--report-path", reportFile,
		"--no-git",
	)
	// gitleaks exits with code 1 when findings exist, so we don't check the error
	cmd.Run()

	reportData, err := os.ReadFile(reportFile)
	if err != nil {
		// No report means no findings
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte("[]"))
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(reportData)
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	http.HandleFunc("/scan", handleScan)

	fmt.Printf("gitleaks-server listening on :%s\n", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		fmt.Fprintf(os.Stderr, "Server error: %v\n", err)
		os.Exit(1)
	}
}
