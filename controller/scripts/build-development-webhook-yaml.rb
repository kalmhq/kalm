require "yaml"
require "base64"

data = File.read(File.dirname(__FILE__) + "/../tmp/kustomized-webhook-manifests.yaml")

cert = File.read(File.dirname(__FILE__) + "/../tmp/tls.crt")
caBundle = Base64.strict_encode64(cert)

rstFile = File.open(File.dirname(__FILE__) + "/../tmp/webhooks.yaml", 'w')
rstFile.truncate(0)

YAML.load_stream(data) do |file|

  if file["webhooks"] == nil 
    next
  end
  
  file["webhooks"].each do |webhook|
      webhook["clientConfig"]["caBundle"] = caBundle
      webhook["clientConfig"]["url"] = "https://host.minikube.internal:9443" + webhook["clientConfig"]["service"]["path"]
      webhook["clientConfig"].delete("service")
  end

  rstFile.write("---\n" + file.to_yaml)
end

#file = YAML.load_file(File.dirname(__FILE__) + "/../tmp/kustomized-webhook-manifests.yaml")
