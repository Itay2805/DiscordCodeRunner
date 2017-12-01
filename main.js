const Discord = require('discord.js');
const fs = require('fs');
const process = require('child_process');

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
    cs: {
        // windows only for now

        run: function(msg, code, inputText) {
            var bannedClasses = [
                "using System.IO",
                "System.IO.Directory",
                "System.IO.DirectoryInfo",
                "System.IO.DirectoryNotFoundException",
                "System.IO.DriveInfo",
                "System.IO.DriveNotFoundException",
                "System.IO.File",
                "System.IO.FileFormatException",
                "System.IO.FileInfo",
                "System.IO.FileLoadException",
                "System.IO.FileNotFoundException",
                "System.IO.FileStream",
                "System.IO.FileSystemEventArgs",
                "System.IO.FileSystemInfo",
                "System.IO.FileSystemWatcher",
                "System.IO.DriveType",
                "System.IO.FileAccess",
                "System.IO.FileAttributes",
                "System.IO.FileMode",
                "System.IO.FileOptions",
                "System.IO.FileShare"
                
            ];

            for(var i = 0; i < bannedClasses.length; i++) {
                var lib = bannedClasses[i];
                if(code.includes(lib)) {
                    output(msg, "", "The library `" + lib + "` is not allowed! Please remove it!", "C#", "https://i.imgur.com/EteU9we.png");
                    return; 
                }
            }

            var finalFileName = "cs_" + getRandomInt(1000, 9999) + ".cs"
            var file = "temp_files/" + finalFileName;
            fs.writeFile(file, code, function(err) {
                if (err) {
                    msg.reply("Could not create file: " + err);
                    return;
                }

                // compile the CS to EXE
                var assembly = "CS_compiled_" + getRandomInt(1000, 9999) + ".exe";
                process.exec(`c:\\Windows\\Microsoft.NET\\Framework\\v3.5\\csc.exe /t:exe /out:` + assembly + " " + finalFileName, {
                    cwd: 'temp_files'
                }, function(err, stdout, stderr) {
                    assembly = "temp_files/" + assembly;
                    if (err) {
                        output(msg, "", err.toString(), "C#", "https://i.imgur.com/EteU9we.png");
                    } else {
                        if (stderr || stderr.trim() !== "") {
                            output(msg, stdout, stderr, "C#", "https://i.imgur.com/EteU9we.png");
                            fs.unlink(assembly, function(err) {});
                        } else {
                            // run the compiled EXE
                            var child = process.execFile(assembly, {
                                timeout: 5000
                            }, function(err, stdout, stderr) {
                                if (err) {
                                    output(msg, "", err.toString(), "C#", "https://i.imgur.com/EteU9we.png");
                                } else {
                                    output(msg, stdout, stderr, "C#", "https://i.imgur.com/EteU9we.png");
                                }
                                // delete the EXE
                                fs.unlink(assembly, function(err) {});
                            });
                            if(inputText && inputText != "") child.stdin.write(inputText);
                        }
                    }
                    // delete source file
                    fs.unlink(file, function() {});
                });
            });
        }            
    },
    js: {
        run: function(msg, code, inputText) {
            var requireFunc = "_internal_require_" + getRandomInt(1000, 9999);
            code = `var require;
                    (function() {
                        var ${requireFunc} = require; 
                        require = function(module) {
                            if(module == "fs" || module == "child_process" || module == "dgram" || module == "net" || module == "os" || module == "http" || module == "https") {
                                var err = "The library '" + module + "' is not allowed! Please remove it!";
                                throw err;
                            }
                            return ${requireFunc}(module);
                        }
                        require.prototype.toString = function() {
                            return ${requireFunc}.toString();
                        }
                    })();
                    ${code}`;

            var file = "temp_files/javascript_" + getRandomInt(1000, 9999) + ".js";
            fs.writeFile(file, code, function(err) {
                if (err) {
                    msg.reply("Could not create file: " + err);
                    return;
                }
                var child = process.exec('node ' + file, {
                    timeout: 5000
                }, function(err, stdout, stderr) {
                    if (err) {
                        console.log(err);
                        if (err.toString().includes("The library") || err.toString().includes("is not allowed! Please remove it!")) {
                            var library = (/'([^']+)'/g).exec(err.toString())[1];
                            output(msg, "", "The library `" + library + "` is not allowed! Please remove it!", "JavaScript", "https://hckr.news/content/images/2015/12/Unofficial_JavaScript_logo_2-svg-1.png");
                        } else {
                            output(msg, "", err.toString(), "JavaScript", "https://hckr.news/content/images/2015/12/Unofficial_JavaScript_logo_2-svg-1.png");
                        }
                    } else {
                        output(msg, stdout, stderr, "JavaScript", "https://hckr.news/content/images/2015/12/Unofficial_JavaScript_logo_2-svg-1.png");
                    }
                    fs.unlink(file, function() {});
                });
                if(inputText && inputText != "") child.stdin.write(inputText);
            });
        }
    },
    cpp: {
        run: function(msg, code, inputText) {
            var file = "temp_files/cpp_" + getRandomInt(1000, 9999) + ".cpp";
            fs.writeFile(file, code, function(err) {
                if (err) {
                    msg.reply("Could not create file: " + err);
                    return;
                }

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
                process.exec('g++ -std=c++17 ' + file + ' -o ' + assembly, function(err, stdout, stderr) {
                    if (err) {
                        output(msg, "", err.toString(), "C++", "https://raw.githubusercontent.com/isocpp/logos/master/cpp_logo.png");
                    } else {
                        if (stderr || stderr.trim() !== "") {
                            output(msg, stdout, stderr, "C++", "https://raw.githubusercontent.com/isocpp/logos/master/cpp_logo.png");
                            fs.unlink(assembly, function(err) {});
                        } else {
                            // run the compiled EXE
                            var child = process.execFile(assembly, {
                                timeout: 5000
                            }, function(err, stdout, stderr) {
                                if (err) {
                                    output(msg, "", err.toString(), "C++", "http://www.freeiconspng.com/uploads/c--logo-icon-0.png");
                                } else {
                                    output(msg, stdout, stderr, "C++", "http://www.freeiconspng.com/uploads/c--logo-icon-0.png");
                                }
                                // delete the EXE
                                fs.unlink(assembly, function(err) {});
                            });
                            if(inputText && inputText != "") child.stdin.write(inputText);
                        }
                    }
                    // delete source file
                    fs.unlink(file, function() {});
                });
            });
        }
    },
    // disabled because there is no checking of libraries
    // python: {
    //     run: function(msg, code) {
    //         {
    //             msg.reply("Python is not allowed for now.");
    //             return;
    //         }
    //         var file = "temp_files/python_" + getRandomInt(1000, 9999) + ".py";
    //         fs.writeFile(file, code, function(err) {
    //             if (err) {
    //                 msg.reply("Could not create file: " + err);
    //                 return;
    //             }
    //             exec('python ' + file, function(err, stdout, stderr) {
    //                 if (err) {
    //                     output(msg, "", err.toString(), "Python", "http://blog.lfe.io/assets/images/posts/Python-logo.png");
    //                 } else {
    //                     output(msg, stdout, stderr, "Python", "http://blog.lfe.io/assets/images/posts/Python-logo.png");
    //                 }
    //                 fs.unlink(file, function() {});
    //             });
    //         });
    //     }
    // },
    java: {
        run: function(msg, code, inputText) {
            var folder = "temp_files/java_" + getRandomInt(1000, 9999) + "/"
            fs.mkdir(folder, function(err) {
                if (err) {
                    msg.reply("Could not create folder: " + err);
                    return;
                }
                var classes = [];
                var main = "null";
                var lines = code.split('\n');
                var count = 0;
                var firstOpen = false;
                var currentSource = "";
                for (var i = 0; i < lines.length; i++) {
                    var line = lines[i];
                    for (var j = 0; j < line.length; j++) {
                        var c = line.charAt(j);
                        if (c == '{') {
                            firstOpen = true;
                            count++;
                        }
                        if (c == '}') {
                            count--;
                        }
                        currentSource += c;

                        if (firstOpen && count == 0) {
                            var classNameRegex = /class\s+([a-zA-Z_][a-zA-Z_0-9]*)\s*/g
                            var className = classNameRegex.exec(currentSource)[1];
                            classes.push({
                                source: currentSource,
                                className: className
                            });
                            firstOpen = false;
                            count = 0;
                            currentSource = "";
                        }
                    }
                    currentSource += "\n";
                }

                for (var i = 0; i < classes.length; i++) {
                    var clazz = classes[i];
                    var fileName = folder + clazz.className + ".java";
                    var checkMain = /(public\s+)?static\s+void\s+main\s*\(String(\[\])?\s+[a-zA-Z_][a-zA-Z_0-9]*(\[\])?\)\s*{[^}]*}/g

                    function error(lib) {
                        output(msg, "", "The library `" + lib + "` is not allowed! Please remove it!", "Java", "http://logodatabases.com/wp-content/uploads/2012/03/java-logo-large.png");
                        for (var i = 0; i < classes.length; i++) {
                            var clazz = classes[i];
                            var fileName = folder + clazz.className + ".java";
                            var className = folder + clazz.className + ".class";
                            fs.unlink(fileName, function() {});
                            fs.unlink(className, function() {});
                        }
                        fs.rmdirSync(folder);
                    }

                    var bannedClasses = [
                        "java.io.File",
                        "java.io.FileDescriptor",
                        "java.io.FileInputStream",
                        "java.io.FileOutputStream",
                        "java.io.FilePermission",
                        "java.io.FileReader",
                        "java.io.FileWriter",
                        "java.io.RandomAccessFile",
                        "java.io.*",

                        "java.lang.Process",
                        "java.lang.ProcessBuilder",
                        "java.lang.Runtime",
                        "java.lang.RuntimePermission",
                        "java.lang.*",

                        "java.lang.reflect",
                        "java.net",
                    ];

                    for (var j = 0; j < bannedClasses.length; j++) {
                        var bannedClass = bannedClasses[i];
                        if (clazz.source.includes(bannedClass)) {
                            error(bannedClass);
                            return;
                        }
                    }


                    if (checkMain.exec(clazz.source)) {
                        main = clazz.className;
                    }
                    fs.writeFileSync(fileName, clazz.source);
                }

                process.exec('javac ' + folder + "*.java", function(err, stdout, stderr) {
                    if (err) {
                        output(msg, "", err.toString(), "Java", "http://logodatabases.com/wp-content/uploads/2012/03/java-logo-large.png");
                        for (var i = 0; i < classes.length; i++) {
                            var clazz = classes[i];
                            var fileName = folder + clazz.className + ".java";
                            var className = folder + clazz.className + ".class";
                            try {
                                fs.unlinkSync(fileName);
                                fs.unlinkSync(className);
                            }catch(err) {}
                        }
                        fs.rmdirSync(folder);
                        return;
                    }
                    var child = process.exec('java ' + main, {
                        cwd: folder,
                        timeout: 5000
                    }, function(err, stdout, stderr) {
                        if (err) {
                            output(msg, "", err.toString(), "Java", "http://logodatabases.com/wp-content/uploads/2012/03/java-logo-large.png");
                        } else {
                            output(msg, stdout, stderr, "Java", "http://logodatabases.com/wp-content/uploads/2012/03/java-logo-large.png");
                        }
                        for (var i = 0; i < classes.length; i++) {
                            var clazz = classes[i];
                            var fileName = folder + clazz.className + ".java";
                            var className = folder + clazz.className + ".class";
                            fs.unlinkSync(fileName);
                            fs.unlinkSync(className);
                        }
                        fs.rmdirSync(folder);
                    });
                    if(inputText && inputText != "") child.stdin.write(inputText);
                });
            });
        }
    }
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
        var inputMatch, sourceMatch;

        var match1 = codeExtract.exec(msg.content);
        if (match1 != null) {
            var text = match1[1];
            var lines = text.split("\n")
            var name = lines[0].toLowerCase().trim();
            if (name == "input") {
                inputMatch = match1;
            } else {
                sourceMatch = match1;
            }
        }

        var match2 = codeExtract.exec(msg.content);
        if (match2 != null) {
            var text = match2[1];
            var lines = text.split("\n")
            var name = lines[0].toLowerCase().trim();
            if (name == "input") {
                inputMatch = match2;
            } else {
                sourceMatch = match2;
            }
        }

        if (sourceMatch != null) {
            var text = sourceMatch[1];
            var lines = text.split("\n")
            var name = lines[0].toLowerCase().trim();
            var inputText = "";
            if(inputMatch != null) {
                var inputText = inputMatch[1].substr(6);
                if (!inputText.endsWith('\n')) {
                    inputText += "\n";
                }
            }
            if (languages[name]) {
                var code = lines.slice(1, lines.length).join("\n");
                var lang = languages[name];
                lang.run(msg, code, inputText);
            } else {
                msg.reply("Unknown language: " + text[0] + ". for list of languages !languages");
            }
        }
    } else if (msg.content.startsWith("!languages")) {
        msg.reply(languagesSTR);
    }
});

client.login(botToken)
