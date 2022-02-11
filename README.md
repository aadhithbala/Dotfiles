# Dotfiles

## Screenshots

![Neofetch](src/neofetch.png)

![Spotify](src/spot_cava.png)

![Htop](src/htop.png)

![Nvim/Ranger](src/nvim_ranger.png)

## Zsh

1. ZSH shell ```sudo pacman -S zsh```

2. OH_MY_ZSH ```sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"```

3. Powerlevel10k ```git clone https://github.com/romkatv/powerlevel10k.git $ZSH_CUSTOM/themes/powerlevel10k```

4. Exa ```sudo pacman -S exa```

#### Plugins

- zsh-autosuggestions ```git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions```

- zsh-syntax-highlighting ```git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting```


## Icons

- Papirus Icon ```wget -qO- https://git.io/papirus-icon-theme-install | sh```

- Papirus Folders script ```wget -qO- https://git.io/papirus-folders-install | sh```

#### Script Usage

Papirus-folders doesn't have a GUI, but it is a fully functional command-line application with TAB-completions. Below you'll see some examples of use.

Show the current color and available colors for Papirus-Dark

```papirus-folders -l --theme Papirus-Dark```

Change color of folders to brown for Papirus-Dark

```papirus-folders -C brown --theme Papirus-Dark```

Revert to default color of folders for Papirus-Dark

```papirus-folders -D --theme Papirus-Dark```

Restore the last used color from a config file

```papirus-folders -Ru```

## Fonts

As we all know font rendering is pretty meh in Linux, These fonts seem to be working out pretty good for me.

- UI - Lexend Deca, Rubik, Ubuntu
- Terminal - Terminal font is usually a toss up between JetBrainsMono, Cascadia Code and Apple's SF Mono
- Documents - Roboto Regular

![Here's how they look](src/fonts.png)
