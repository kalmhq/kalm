require "yaml"
require "base64"

if ARGV.size != 2 
  puts "run like this: \n update-kalmop-config-yaml.rb dashboard 3031f2fe3fb63b8edc06e54904d2b3f16e4416af"
  return
end

comp = ARGV[0]
version = ARGV[1]

configPath = File.dirname(__FILE__) + "/../tmp/kalm-op-config.yaml"

config = YAML.load_file(configPath) 

config["spec"] ||= {}
config["spec"][comp] ||= {}
config["spec"][comp]["version"] = version

File.open(File.dirname(__FILE__) + "/../tmp/updated.yaml", "w") { |file| file.write(config.to_yaml) }
