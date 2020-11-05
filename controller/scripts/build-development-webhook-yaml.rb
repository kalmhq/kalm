require "yaml"
require "base64"

file = YAML.load_file(File.dirname(__FILE__) + "/../config/webhook/manifests.yaml")
cert = File.read(File.dirname(__FILE__) + "/../tmp/tls.crt")

caBundle = Base64.strict_encode64(cert)

file["webhooks"].each do |webhook|
    webhook["clientConfig"]["caBundle"] = caBundle
    webhook["clientConfig"]["url"] = "https://host.minikube.internal:9443" + webhook["clientConfig"]["service"]["path"]
    webhook["clientConfig"].delete("service")
end

File.write(File.dirname(__FILE__) + "/../tmp/webhooks.yaml", file.to_yaml)