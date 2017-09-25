const Discord = require('discord.js');
const fs = require('fs');
const exec = require('child_process').exec;
const execFile = require('child_process').execFile;

var botConfig = JSON.parse(fs.readFileSync('bot-config.json', 'utf8'));
var botToken = botConfig.bot_token;

const client = new Discord.Client();

client.on('ready', () => {
    console.log("Connected!");
});

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

function output(msg, stdout, stderr, lang, icon) {
    if (stderr || stderr.trim() !== "") {
        if (stdout || stdout.trim() !== "") {
            msg.reply("Program ran with errors", {
                embed: {
                    title: "Errors",
                    color: 0xE74C3C, // #E74C3C
                    description: stderr,
                    author: {
                        name: lang,
                        icon_url: icon
                    },
                    fields: [{
                        name: "Output",
                        value: stdout
                    }]
                }
            });
        } else {
            msg.reply("Program ran with errors", {
                embed: {
                    title: "Errors",
                    color: 0xE74C3C, // #E74C3C
                    description: stderr,
                    author: {
                        name: lang,
                        icon_url: icon
                    }
                }
            });
        }
    } else {
        msg.reply("Program ran without errors", {
            embed: {
                title: "Output",
                color: 0x2ECC71, // #2ECC71
                description: stdout,
                author: {
                    name: lang,
                    icon_url: icon
                }
            }
        });
    }
}

var languages = {
    js: {
        run: function(msg, file, code) {
            exec('node ' + file, function(err, stdout, stderr) {
                if (err) {
                    output(msg, "", err.toString(), "JavaScript", "https://hckr.news/content/images/2015/12/Unofficial_JavaScript_logo_2-svg-1.png");
                } else {
                    output(msg, stdout, stderr, "JavaScript", "https://hckr.news/content/images/2015/12/Unofficial_JavaScript_logo_2-svg-1.png");
                }
                fs.unlink(file, function() {});
            });
        },
        ext: "js"
    },
    cpp: {
        run: function(msg, file, code) {
            // check for banned libraries and methods
            var includeCSETJMP = /#include\s+<csetjmp>/gi;
            var includeCSTDIO = /#include\s+<cstdio>/gi;
            var bannedCSTDIOMethods = /(fopen|freopen|fclose|fflush|setbuf|setvbuf|ftell|fgetpos|rewind|remove|rename|tmpfile|tmpnam)\s*\([^\)]*\)/g
            var includeFSTREAM = /#include\s+<fstream>/gi;
            var includeFILESYSTEM = /#include\s+<filesystem>/gi;

            if (includeCSETJMP.exec(code)) {
                output(msg, "", "the library `csetjmp` is not allowed! Please remove it!", "C++", "https://raw.githubusercontent.com/isocpp/logos/master/cpp_logo.png");
                fs.unlink(file, function() {});
                return;
            }

            if (includeFSTREAM.exec(code)) {
                output(msg, "", "the library `fstream` is not allowed! Please remove it!", "C++", "https://raw.githubusercontent.com/isocpp/logos/master/cpp_logo.png");
                fs.unlink(file, function() {});
                return;
            }

            if (includeFILESYSTEM.exec(code)) {
                output(msg, "", "the library `filesystem` is not allowed! Please remove it!", "C++", "https://raw.githubusercontent.com/isocpp/logos/master/cpp_logo.png");
                fs.unlink(file, function() {});
                return;
            }

            if (includeCSTDIO.exec(code) && bannedCSTDIOMethods.exec(code)) {
                output(msg, "", "File IO functions from `cstdio` are not allowed", "C++", "https://raw.githubusercontent.com/isocpp/logos/master/cpp_logo.png");
                fs.unlink(file, function() {});
                return;
            }

            // compile the CPP to EXE
            var assembly = "temp_files/CPP_compiled_" + getRandomInt(1000, 9999) + ".exe";
            exec('g++ -std=c++17 ' + file + ' -o ' + assembly, function(err, stdout, stderr) {
                if (err) {
                    output(msg, "", err.toString(), "C++", "https://raw.githubusercontent.com/isocpp/logos/master/cpp_logo.png");
                } else {
                    if (stderr || stderr.trim() !== "") {
                        output(msg, stdout, stderr, "C++", "https://raw.githubusercontent.com/isocpp/logos/master/cpp_logo.png");
                        fs.unlink(assembly, function(err) {});
                    } else {
                        // run the compiled EXE
                        execFile(assembly, function(err, stdout, stderr) {
                            if (err) {
                                output(msg, "", err.toString(), "C++", "http://www.freeiconspng.com/uploads/c--logo-icon-0.png");
                            } else {
                                output(msg, stdout, stderr, "C++", "http://www.freeiconspng.com/uploads/c--logo-icon-0.png");
                            }
                            // delete the EXE
                            fs.unlink(assembly, function(err) {});
                        });
                    }
                }
                // delete source file
                fs.unlink(file, function() {});
            });
        },
        ext: "cpp"
    },
    python: {
        run: function(msg, file, code) {
            exec('python ' + file, function(err, stdout, stderr) {
                if (err) {
                    output(msg, "", err.toString(), "Python", "http://blog.lfe.io/assets/images/posts/Python-logo.png");
                } else {
                    output(msg, stdout, stderr, "Python", "http://blog.lfe.io/assets/images/posts/Python-logo.png");
                }
                fs.unlink(file, function() {});
            });
        },
        ext: "py"
    },
};

// generate languages string
var languagesSTR = "Supported Languages: ";
for (var key in languages) {
    if (!languages.hasOwnProperty(key)) continue;
    languagesSTR += key + ", ";
}
languagesSTR = languagesSTR.substr(0, languagesSTR.length - 2);

client.on('message', msg => {
    var codeExtract = /```([^`]*)```/g
    if (msg.content.trim().startsWith("!run")) {
        var match = codeExtract.exec(msg.content);
        if (match != null) {
            var text = match[1];
            var lines = text.split("\n")
            var name = lines[0].toLowerCase();
            console.log(name);
            if (languages[name]) {
                var code = lines.slice(1, lines.length).join("\n");
                console.log(code);
                var lang = languages[name];
                var fileName = "temp_files/" + name + "_" + getRandomInt(1000, 9999) + "." + lang.ext;
                fs.writeFile(fileName, code, function(err) {
                    if (err) {
                        msg.reply("Could not create file: " + err);
                        return;
                    }
                    lang.run(msg, fileName, code);
                });
            } else {
                msg.reply("Unknown language: " + text[0] + ". for list of languages !languages");
            }
        } else {
            console.log(match);
        }
    } else if (msg.content.startsWith("!languages")) {
        msg.reply(languagesSTR);
    }
});

client.login(botToken)
