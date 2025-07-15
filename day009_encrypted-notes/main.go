package main

import (
	"bufio"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"golang.org/x/crypto/ssh/terminal"
)

type Note struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type EncryptedData struct {
	Data string `json:"data"`
	IV   string `json:"iv"`
}

const notesFile = ".encrypted_notes.json"

func main() {
	var (
		add    = flag.Bool("add", false, "Add a new note")
		list   = flag.Bool("list", false, "List all notes")
		read   = flag.String("read", "", "Read a note by ID")
		delete = flag.String("delete", "", "Delete a note by ID")
		update = flag.String("update", "", "Update a note by ID")
	)
	flag.Parse()

	homeDir, err := os.UserHomeDir()
	if err != nil {
		fmt.Printf("Error getting home directory: %v\n", err)
		os.Exit(1)
	}
	notesPath := filepath.Join(homeDir, notesFile)

	switch {
	case *add:
		addNote(notesPath)
	case *list:
		listNotes(notesPath)
	case *read != "":
		readNote(notesPath, *read)
	case *delete != "":
		deleteNote(notesPath, *delete)
	case *update != "":
		updateNote(notesPath, *update)
	default:
		fmt.Println("Encrypted Notes - A secure note-taking CLI")
		fmt.Println("\nUsage:")
		fmt.Println("  -add          Add a new note")
		fmt.Println("  -list         List all notes")
		fmt.Println("  -read <id>    Read a note by ID")
		fmt.Println("  -update <id>  Update a note by ID")
		fmt.Println("  -delete <id>  Delete a note by ID")
	}
}

func getPassword(prompt string) ([]byte, error) {
	fmt.Print(prompt)
	password, err := terminal.ReadPassword(int(syscall.Stdin))
	fmt.Println()
	return password, err
}

func deriveKey(password []byte) []byte {
	hash := sha256.Sum256(password)
	return hash[:]
}

func encrypt(plaintext []byte, password []byte) (*EncryptedData, error) {
	key := deriveKey(password)
	
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	ciphertext := make([]byte, aes.BlockSize+len(plaintext))
	iv := ciphertext[:aes.BlockSize]
	if _, err := io.ReadFull(rand.Reader, iv); err != nil {
		return nil, err
	}

	stream := cipher.NewCFBEncrypter(block, iv)
	stream.XORKeyStream(ciphertext[aes.BlockSize:], plaintext)

	return &EncryptedData{
		Data: base64.StdEncoding.EncodeToString(ciphertext[aes.BlockSize:]),
		IV:   base64.StdEncoding.EncodeToString(iv),
	}, nil
}

func decrypt(encData *EncryptedData, password []byte) ([]byte, error) {
	key := deriveKey(password)
	
	ciphertext, err := base64.StdEncoding.DecodeString(encData.Data)
	if err != nil {
		return nil, err
	}
	
	iv, err := base64.StdEncoding.DecodeString(encData.IV)
	if err != nil {
		return nil, err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	stream := cipher.NewCFBDecrypter(block, iv)
	plaintext := make([]byte, len(ciphertext))
	stream.XORKeyStream(plaintext, ciphertext)

	return plaintext, nil
}

func loadNotes(path string, password []byte) ([]Note, error) {
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return []Note{}, nil
	}

	data, err := ioutil.ReadFile(path)
	if err != nil {
		return nil, err
	}

	if len(data) == 0 {
		return []Note{}, nil
	}

	var encData EncryptedData
	if err := json.Unmarshal(data, &encData); err != nil {
		return nil, err
	}

	decrypted, err := decrypt(&encData, password)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt: wrong password?")
	}

	var notes []Note
	if err := json.Unmarshal(decrypted, &notes); err != nil {
		return nil, err
	}

	return notes, nil
}

func saveNotes(path string, notes []Note, password []byte) error {
	data, err := json.Marshal(notes)
	if err != nil {
		return err
	}

	encData, err := encrypt(data, password)
	if err != nil {
		return err
	}

	encJSON, err := json.Marshal(encData)
	if err != nil {
		return err
	}

	return ioutil.WriteFile(path, encJSON, 0600)
}

func generateID() string {
	return fmt.Sprintf("%d", time.Now().Unix())
}

func addNote(path string) {
	password, err := getPassword("Enter password: ")
	if err != nil {
		fmt.Printf("Error reading password: %v\n", err)
		return
	}

	notes, err := loadNotes(path, password)
	if err != nil {
		fmt.Printf("Error loading notes: %v\n", err)
		return
	}

	reader := bufio.NewReader(os.Stdin)
	
	fmt.Print("Enter title: ")
	title, _ := reader.ReadString('\n')
	title = strings.TrimSpace(title)

	fmt.Println("Enter content (press Ctrl+D when done):")
	content := ""
	scanner := bufio.NewScanner(os.Stdin)
	for scanner.Scan() {
		content += scanner.Text() + "\n"
	}

	note := Note{
		ID:        generateID(),
		Title:     title,
		Content:   strings.TrimSpace(content),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	notes = append(notes, note)

	if err := saveNotes(path, notes, password); err != nil {
		fmt.Printf("Error saving note: %v\n", err)
		return
	}

	fmt.Printf("Note saved with ID: %s\n", note.ID)
}

func listNotes(path string) {
	password, err := getPassword("Enter password: ")
	if err != nil {
		fmt.Printf("Error reading password: %v\n", err)
		return
	}

	notes, err := loadNotes(path, password)
	if err != nil {
		fmt.Printf("Error loading notes: %v\n", err)
		return
	}

	if len(notes) == 0 {
		fmt.Println("No notes found.")
		return
	}

	fmt.Println("\nYour Notes:")
	fmt.Println(strings.Repeat("-", 50))
	for _, note := range notes {
		fmt.Printf("ID: %s\n", note.ID)
		fmt.Printf("Title: %s\n", note.Title)
		fmt.Printf("Created: %s\n", note.CreatedAt.Format("2006-01-02 15:04"))
		fmt.Printf("Updated: %s\n", note.UpdatedAt.Format("2006-01-02 15:04"))
		fmt.Println(strings.Repeat("-", 50))
	}
}

func readNote(path, id string) {
	password, err := getPassword("Enter password: ")
	if err != nil {
		fmt.Printf("Error reading password: %v\n", err)
		return
	}

	notes, err := loadNotes(path, password)
	if err != nil {
		fmt.Printf("Error loading notes: %v\n", err)
		return
	}

	for _, note := range notes {
		if note.ID == id {
			fmt.Printf("\nTitle: %s\n", note.Title)
			fmt.Printf("Created: %s\n", note.CreatedAt.Format("2006-01-02 15:04"))
			fmt.Printf("Updated: %s\n", note.UpdatedAt.Format("2006-01-02 15:04"))
			fmt.Println("\nContent:")
			fmt.Println(note.Content)
			return
		}
	}

	fmt.Printf("Note with ID %s not found.\n", id)
}

func deleteNote(path, id string) {
	password, err := getPassword("Enter password: ")
	if err != nil {
		fmt.Printf("Error reading password: %v\n", err)
		return
	}

	notes, err := loadNotes(path, password)
	if err != nil {
		fmt.Printf("Error loading notes: %v\n", err)
		return
	}

	newNotes := []Note{}
	found := false
	for _, note := range notes {
		if note.ID != id {
			newNotes = append(newNotes, note)
		} else {
			found = true
		}
	}

	if !found {
		fmt.Printf("Note with ID %s not found.\n", id)
		return
	}

	if err := saveNotes(path, newNotes, password); err != nil {
		fmt.Printf("Error saving notes: %v\n", err)
		return
	}

	fmt.Printf("Note %s deleted successfully.\n", id)
}

func updateNote(path, id string) {
	password, err := getPassword("Enter password: ")
	if err != nil {
		fmt.Printf("Error reading password: %v\n", err)
		return
	}

	notes, err := loadNotes(path, password)
	if err != nil {
		fmt.Printf("Error loading notes: %v\n", err)
		return
	}

	found := false
	for i, note := range notes {
		if note.ID == id {
			found = true
			reader := bufio.NewReader(os.Stdin)
			
			fmt.Printf("Current title: %s\n", note.Title)
			fmt.Print("Enter new title (or press Enter to keep current): ")
			newTitle, _ := reader.ReadString('\n')
			newTitle = strings.TrimSpace(newTitle)
			if newTitle != "" {
				notes[i].Title = newTitle
			}

			fmt.Printf("\nCurrent content:\n%s\n", note.Content)
			fmt.Println("\nEnter new content (press Ctrl+D when done, or Ctrl+C to cancel):")
			content := ""
			scanner := bufio.NewScanner(os.Stdin)
			for scanner.Scan() {
				content += scanner.Text() + "\n"
			}
			
			if strings.TrimSpace(content) != "" {
				notes[i].Content = strings.TrimSpace(content)
			}
			
			notes[i].UpdatedAt = time.Now()
			break
		}
	}

	if !found {
		fmt.Printf("Note with ID %s not found.\n", id)
		return
	}

	if err := saveNotes(path, notes, password); err != nil {
		fmt.Printf("Error saving notes: %v\n", err)
		return
	}

	fmt.Printf("Note %s updated successfully.\n", id)
}