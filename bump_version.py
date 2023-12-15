def updateiOSVesions(version):
  with open("ios/App/App.xcodeproj/project.pbxproj", "r", newline="") as file:
    lines = file.readlines()
  with open("ios/App/App.xcodeproj/project.pbxproj", "w", newline="") as file:
    for line in lines:
      if 'CURRENT_PROJECT_VERSION = ' in line:
        line = '				CURRENT_PROJECT_VERSION = {};\n'.format(version)
      if 'MARKETING_VERSION = ' in line:
        line = '				MARKETING_VERSION = {};\n'.format(version)
      file.write(line)

def updateAndroidVesions(version):
  splittedPackage = list(map(int,version.split(".")))
  buildnumber = splittedPackage[0] * 10000 + splittedPackage[1] * 100 + splittedPackage[2]
  with open("android/app/build.gradle", "r", newline="") as file:
    lines = file.readlines()
  with open("android/app/build.gradle", "w", newline="") as file:
    for line in lines:
      if 'versionCode' in line:
        line = '        versionCode {}\n'.format(buildnumber)
      if 'versionName' in line:
        line = '        versionName "{}"\n'.format(version)
      file.write(line)

if __name__ == "__main__":
  import argparse
  parser = argparse.ArgumentParser()
  parser.add_argument("version")
  parser.parse_args()
  version = parser.parse_args().version
  updateiOSVesions(version)
  updateAndroidVesions(version)