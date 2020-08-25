# Imgconv

This installation script is mainly to ensure that all images can be downloaded correctly in some special network environments (such as Azure China). The principle is to install an image convertor in the kalm-imgconv namespace to translate the image of the external network into the image address corresponding to the azure image mirro site.

## Run

Before running the script, please make sure that kubectl and openssl have been installed

```bash
curl -s https://raw.githubusercontent.com/kalmhq/kalm/v0.1.0-alpha.4/deploy/imgconv/install.sh | bash
```