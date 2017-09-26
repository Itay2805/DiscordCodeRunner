# DiscordCodeRunner
A Discord bot for running code snippets

# Supported Languages
Note, some libraries are banned due to security reasons, to make so the bot can not run code remotely which can modify the system in any way.
## JavaScript
  - uses Node.JS
  - Banned libraries: 
      * `fs`
      * `child_process`
      * `dgram`
      * `net`
      * `os`
      * `http`
      * `https`

## C++
  - uses g++ with std C++17
  - Banned headers:
      * `csetjmp`
      * `cstdio` (only fileIO functions)
      * `fstream`
      * `filesystem`
  - Banned functions from `cstdio`:
      * `fopen`
      * `freopen`
      * `fclose`
      * `fflush`
      * `setbuf`
      * `setvbuf`
      * `ftell`
      * `fgetpos`
      * `rewind`
      * `remove`
      * `rename`
      * `tmpfile`
      * `tmpnam`
  
## Python
  - uses python 3
  - right now there are no banned libraries
 
## Java
  - uses Java (with JDK)
  - Banned classes:
      * `java.io.File`
      * `java.io.FileDescriptor`
      * `java.io.FileInputStream`
      * `java.io.FileOutputStream`
      * `java.io.FilePermission`
      * `java.io.FileReader`
      * `java.io.FileWriter`
      * `java.io.RandomAccessFile`
      * `java.io.*`
      * `java.lang.Process`
      * `java.lang.ProcessBuilder`
      * `java.lang.Runtime`
      * `java.lang.RuntimePermission`
      * `java.lang.*`
      * `java.net"`

# commands
## !languages
  prints a list of all the languages the bot supports
  
## !run <snippet>
  this will take the code snippet and use the language syntax highlighting to determine the language and run it

# Setup
This uses NodeJS, so first you need to make sure NodeJS is installed
1. Download main.js and package.json
2. Open command line and type `npm install`, this will install everything which is needed
3. Create a file called `bot-config.json`, it should contain the following stuff:
  ```JSON
  {
    "bot_token": "<BOT TOKEN>"
  }
  ```
4. Create in the same folder, a folder named `temp_files` 
5. Type in the command line `node main.js`
6. The bot should be running!
