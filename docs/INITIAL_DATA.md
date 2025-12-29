# Initial Data Reference

Reference data for populating the database during development and testing.

## Sources

| Name     | Slug     | Install Command                                    | Requires Sudo | Setup Command                                                                 | API Endpoint |
|----------|----------|----------------------------------------------------|---------------|-------------------------------------------------------------------------------|--------------|
| Flatpak  | flatpak  | `flatpak install -y flathub`                       | false         | `flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo` | https://flathub.org/api/v2/ |
| Snap     | snap     | `snap install`                                     | true          | null                                                                          | https://api.snapcraft.io/v2/ |
| APT      | apt      | `apt install -y`                                   | true          | null                                                                          | null |
| DNF      | dnf      | `dnf install -y`                                   | true          | null                                                                          | null |
| Pacman   | pacman   | `pacman -S --noconfirm`                            | true          | null                                                                          | null |
| Zypper   | zypper   | `zypper install -y`                                | true          | null                                                                          | null |
| AUR      | aur      | `yay -S --noconfirm`                               | false         | `sudo pacman -S --needed git base-devel && git clone https://aur.archlinux.org/yay.git && cd yay && makepkg -si` | https://aur.archlinux.org/rpc/ |

## Distributions

| Name         | Slug         | Family     | Based On | Popular |
|--------------|--------------|------------|----------|---------|
| Ubuntu       | ubuntu       | debian     | debian   | true    |
| Debian       | debian       | debian     | null     | true    |
| Linux Mint   | linuxmint    | debian     | ubuntu   | true    |
| Pop!_OS      | pop          | debian     | ubuntu   | true    |
| Fedora       | fedora       | rhel       | null     | true    |
| Arch Linux   | arch         | arch       | null     | true    |
| Manjaro      | manjaro      | arch       | arch     | true    |
| EndeavourOS  | endeavouros  | arch       | arch     | false   |
| openSUSE     | opensuse     | suse       | null     | false   |
| Zorin OS     | zorin        | debian     | ubuntu   | false   |
| Elementary   | elementary   | debian     | ubuntu   | false   |
| Nobara       | nobara       | rhel       | fedora   | false   |

## Distro-Source Mappings

| Distro       | Available Sources          | Default  | Priorities (high to low) |
|--------------|----------------------------|----------|--------------------------|
| Ubuntu       | apt, flatpak, snap         | apt      | apt(10), flatpak(5), snap(3) |
| Debian       | apt, flatpak               | apt      | apt(10), flatpak(5) |
| Linux Mint   | apt, flatpak               | apt      | apt(10), flatpak(5) |
| Pop!_OS      | apt, flatpak               | apt      | apt(10), flatpak(5) |
| Fedora       | dnf, flatpak               | dnf      | dnf(10), flatpak(5) |
| Arch Linux   | pacman, flatpak, aur       | pacman   | pacman(10), aur(7), flatpak(3) |
| Manjaro      | pacman, flatpak, aur, snap | pacman   | pacman(10), aur(7), flatpak(5), snap(3) |
| openSUSE     | zypper, flatpak            | zypper   | zypper(10), flatpak(5) |

## Categories

| Name          | Slug          | Icon (Lucide)  | Display Order |
|---------------|---------------|----------------|---------------|
| Browsers      | browsers      | Globe          | 1             |
| Development   | development   | Code           | 2             |
| Media         | media         | Play           | 3             |
| Graphics      | graphics      | Image          | 4             |
| Office        | office        | FileText       | 5             |
| Utilities     | utilities     | Wrench         | 6             |
| Communication | communication | MessageCircle  | 7             |
| Games         | games         | Gamepad2       | 8             |
| Security      | security      | Shield         | 9             |
| System        | system        | Settings       | 10            |

## Sample Applications

| App Name      | Slug          | Category      | FOSS  | Popular | Flatpak ID                  | Snap Name    | APT/DNF/Pacman Name |
|---------------|---------------|---------------|-------|---------|-----------------------------|--------------|--------------------|
| Firefox       | firefox       | browsers      | true  | true    | org.mozilla.firefox         | firefox      | firefox            |
| Chrome        | chrome        | browsers      | false | true    | com.google.Chrome           | null         | google-chrome-stable |
| Brave         | brave         | browsers      | true  | false   | com.brave.Browser           | brave        | brave-browser      |
| VS Code       | vscode        | development   | false | true    | com.visualstudio.code       | code         | code               |
| VLC           | vlc           | media         | true  | true    | org.videolan.VLC            | vlc          | vlc                |
| GIMP          | gimp          | graphics      | true  | true    | org.gimp.GIMP               | gimp         | gimp               |
| LibreOffice   | libreoffice   | office        | true  | true    | org.libreoffice.LibreOffice | libreoffice  | libreoffice        |
| Discord       | discord       | communication | false | true    | com.discordapp.Discord      | discord      | null               |
| Slack         | slack         | communication | false | false   | com.slack.Slack             | slack        | slack-desktop      |
| Spotify       | spotify       | media         | false | true    | com.spotify.Client          | spotify      | null               |
| Steam         | steam         | games         | false | true    | com.valvesoftware.Steam     | null         | steam              |
| OBS Studio    | obs           | media         | true  | false   | com.obsproject.Studio       | obs-studio   | obs-studio         |
| Blender       | blender       | graphics      | true  | false   | org.blender.Blender         | blender      | blender            |
| Inkscape      | inkscape      | graphics      | true  | false   | org.inkscape.Inkscape       | inkscape     | inkscape           |
| Kdenlive      | kdenlive      | media         | true  | false   | org.kde.kdenlive            | kdenlive     | kdenlive           |
| Audacity      | audacity      | media         | true  | false   | org.audacityteam.Audacity   | audacity     | audacity           |
| Git           | git           | development   | true  | true    | null                        | null         | git                |
| Node.js       | nodejs        | development   | true  | true    | null                        | node         | nodejs             |
| Docker        | docker        | development   | true  | true    | null                        | docker       | docker.io          |
| htop          | htop          | system        | true  | false   | null                        | htop         | htop               |
| Neofetch      | neofetch      | system        | true  | false   | null                        | null         | neofetch           |
| Thunderbird   | thunderbird   | communication | true  | false   | org.mozilla.Thunderbird     | thunderbird  | thunderbird        |
| FileZilla     | filezilla     | utilities     | true  | false   | org.filezillaproject.Filezilla | filezilla | filezilla          |
| KeePassXC     | keepassxc     | security      | true  | false   | org.keepassxc.KeePassXC     | keepassxc    | keepassxc          |

## Notes

- **null** values mean the package is not available from that source
- Icon names reference Lucide React icons
- Priorities are suggestions; adjust based on distro-specific best practices
- For apps with multiple sources, the actual package identifier may vary
- This is reference data - actual implementation should verify availability via APIs
