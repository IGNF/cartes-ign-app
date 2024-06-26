#!/bin/sh

# Decrypt the file
mkdir $HOME/secrets
# --batch to prevent interactive command
# --yes to assume "yes" for questions
gpg --quiet --batch --yes --decrypt --passphrase="$BUILD_PROVISION_PASSPHRASE" \
--output $HOME/secrets/build.mobileprovision ios/build.mobileprovision.gpg
