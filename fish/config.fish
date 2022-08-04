# Removes the fish greetings at the terminal startup
set fish_greeting

# Aliases

alias py="python3"
alias nv="nvim"
alias 'update'='sudo pacman -Sy && yay -Sy'
alias 'upgrade'='sudo pacman -Syu && echo "UPGRADED"'
alias please=sudo
alias fucking=sudo
alias dl="cd ~/Downloads/"
alias warp-on="warp-cli connect"
alias warp-off="warp-cli disconnect"
alias warp-status="curl https://www.cloudflare.com/cdn-cgi/trace/"
alias update="sudo pacman -Syu"
alias dots="cd ~/Documents/Dotfiles"
alias docs="cd ~/Documents/"
alias kittens="kitty +kitten themes"

# exa alias

alias ls="exa --icons"
alias la="exa --long --icons --all --group"
alias lt="exa --tree --icons"
alias lt1="exa --tree --icons --level=1"
alias lt2="exa --tree --icons --level=2"
alias lt3="exa --tree --icons --level=3"
alias lt4="exa --tree --icons --level=4"

export SUDO_PROMPT="  Sudo Password ❱ "

# Starship config

starship init fish | source
