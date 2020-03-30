BCLDB CSV Export Tool
=====================

Installing Node
---------------
**macOS**
* Install XCode from the AppStore
* Install brew: http://brew.sh/
    * `/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"`
* Install Node.js and npm
    * `brew install node.js`
* Verify Node.js and npm installation
    * `node -v`
    * `npm -v`

**Linux (Ubuntu/Debian)**
* Update package lists
    * `sudo apt update`
* Install Node.js and npm
    * `sudo apt install nodejs`
* Verify Node.js and npm installation
    * `node -v`
    * `npm -v`

Cloning and Installing Application
----------------------------------
* Clone repository into home directory
    * `cd /`
    * `git clone https://github.com/logankuzyk/square-order-automation.git`
    * `npm install`

Run
---

* Run from the directory `~/square-order-automation`:
    * `node .`
    * Follow instructions on screen
* Help:
    * `node bin/cli.js --help`
* Version:
    * `node bin/cli.js --version`
