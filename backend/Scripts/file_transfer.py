"This Script is for transfering the files between the Rasperry Pi and local computer for Git" 
import os
import paramiko
from stat import S_ISDIR

def connect_ssh(host, port, username, password):
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, port=port, username=username, password=password)
    return ssh

def sftp_copy_dir(sftp, local_dir, remote_dir, upload=True):
    if upload:
        # Upload from local to remote
        for root, dirs, files in os.walk(local_dir):
            rel_path = os.path.relpath(root, local_dir)
            remote_path = os.path.join(remote_dir, rel_path).replace("\\", "/")
            try:
                sftp.mkdir(remote_path)
            except IOError:
                pass  # Already exists
            for file in files:
                sftp.put(os.path.join(root, file), f"{remote_path}/{file}")
    else:
        # Download from remote to local
        def recursive_get(remote_path, local_path):
            os.makedirs(local_path, exist_ok=True)
            for item in sftp.listdir_attr(remote_path):
                remote_item_path = f"{remote_path}/{item.filename}"
                local_item_path = os.path.join(local_path, item.filename)
                if S_ISDIR(item.st_mode):
                    recursive_get(remote_item_path, local_item_path)
                else:
                    sftp.get(remote_item_path, local_item_path)
        recursive_get(remote_dir, local_dir)

def main():
    host = "192.168.1.2"
    port = 22
    username = "bobby-fischer"
    password = "ultrafreshekiwi"

    # Lokaler und Remote-Pfad
    local_folder = "C:/Users/i40011981/OneDrive - Endress+Hauser/Desktop/azubiprojekt-2023-digitales-schachbrett/backend/chess-logic"
    remote_folder = "/home/bobby-fischer/Desktop/azubiprojekt"  # Zielverzeichnis auf dem Pi

    direction = input("Wähle Richtung (upload/download): ").strip().lower()

    ssh = connect_ssh(host, port, username, password)
    sftp = ssh.open_sftp()

    if direction == "upload":
        print(f"Lade {local_folder} → {remote_folder} hoch ...")
        sftp_copy_dir(sftp, local_folder, remote_folder, upload=True)
    elif direction == "download":
        print(f"Lade {remote_folder} → {local_folder} herunter ...")
        sftp_copy_dir(sftp, local_folder, remote_folder, upload=False)
    else:
        print("Ungültige Eingabe. Bitte 'upload' oder 'download' eingeben.")

    sftp.close()
    ssh.close()
    print("Done.")

if __name__ == "__main__":
    main()
