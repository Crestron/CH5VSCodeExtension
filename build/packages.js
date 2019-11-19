var cproc = require('child_process');
var fs = require('fs');
var extensionOutput = './output';

// Runtime = {
//     UnknownRuntime : 'Unknown',
//     UnknownVersion : 'Unknown',
//     Windows_7_86 : 'Windows_7_86',
//     Windows_7_64 : 'Windows_7_64',
//     OSX_10_11_64 :  'OSX_10_11_64',
//     CentOS_7 : 'CentOS_7',
//     Debian_8 : 'Debian_8',
//     Fedora_23 : 'Fedora_23',
//     OpenSUSE_13_2 : 'OpenSUSE_13_2',
//     SLES_12_2 : 'SLES_12_2',
//     RHEL_7 : 'RHEL_7',
//     Ubuntu_14 : 'Ubuntu_14',
//     Ubuntu_16 : 'Ubuntu_16'
// }

function doPackageSync(packageName) {
    var vsceArgs = [];
    vsceArgs.push('vsce');
    vsceArgs.push('package'); // package command
    if (packageName !== undefined) {
        vsceArgs.push('-o');
        vsceArgs.push(`output/${packageName}`);
        if (!fs.existsSync(extensionOutput)) {
            fs.mkdirSync(extensionOutput);
        }
    }
    var command = vsceArgs.join(' ');
    
    console.log(command);
    
    return cproc.execSync(command);
}

function doOfflinePackage(packageName) {
    return doPackageSync(packageName + '.vsix');

}

//Install vsce to be able to run this function: npm install -g vsce
function buildPackage() {
    var json = JSON.parse(fs.readFileSync('package.json'));
    var name = json.name;
    var version = json.version;
    var packageName = name + '-' + version;

    return doOfflinePackage(packageName);
}

buildPackage();
