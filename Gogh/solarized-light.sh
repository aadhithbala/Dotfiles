#!/usr/bin/env bash

# ====================CONFIG THIS =============================== #
export COLOR_01="#073642"           # HOST
export COLOR_02="#DC322F"           # SYNTAX_STRING
export COLOR_03="#859900"           # COMMAND
export COLOR_04="#B58900"           # COMMAND_COLOR2
export COLOR_05="#268BD2"           # PATH
export COLOR_06="#D33682"           # SYNTAX_VAR
export COLOR_07="#2AA198"           # PROMP
export COLOR_08="#EEE8D5"           #

export COLOR_09="#002B36"           #
export COLOR_10="#CB4B16"           # COMMAND_ERROR
export COLOR_11="#586E75"           # EXEC
export COLOR_12="#657B83"           #
export COLOR_13="#839496"           # FOLDER
export COLOR_14="#6C71C4"           #
export COLOR_15="#93A1A1"           #
export COLOR_16="#FDF6E3"           #

export BACKGROUND_COLOR="#FDF6E3"   # Background Color
export FOREGROUND_COLOR="#657B83"   # Text
BOLD_COLOR="#586E75"         # Bold
export CURSOR_COLOR="$FOREGROUND_COLOR" # Cursor
export PROFILE_NAME="Solarized Light"
# =============================================================== #






# =============================================================== #
# | Apply Colors
# ===============================================================|#
SCRIPT_PATH="${SCRIPT_PATH:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
PARENT_PATH="$(dirname "${SCRIPT_PATH}")"

# Allow developer to change url to forked url for easier testing
# IMPORTANT: Make sure you export this variable if your main shell is not bash
BASE_URL=${BASE_URL:-"https://raw.githubusercontent.com/Mayccoll/Gogh/master"}


if [[ -e "${PARENT_PATH}/apply-colors.sh" ]]; then
  bash "${PARENT_PATH}/apply-colors.sh"
else
  if [[ "$(uname)" = "Darwin" ]]; then
    # OSX ships with curl and ancient bash
    bash -c "$(curl -so- "${BASE_URL}/apply-colors.sh")"
  else
    # Linux ships with wget
    bash -c "$(wget -qO- "${BASE_URL}/apply-colors.sh")"
  fi
fi
