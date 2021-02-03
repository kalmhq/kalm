package validation

// TODO: The codes are copied from istio project for temporary usage. It's a little hard to solve the conflict with go mod.

import (
	"fmt"
	"net"
	"regexp"
	"strconv"
	"strings"
)

const (
	DNS1123LabelMaxLength = 63 // Public for testing only.
	dns1123LabelFmt       = "[a-zA-Z0-9](?:[-a-zA-Z0-9]*[a-zA-Z0-9])?"
	// a wild-card prefix is an '*', a normal DNS1123 label with a leading '*' or '*-', or a normal DNS1123 label
	wildcardPrefix = `(\*|(\*|\*-)?` + dns1123LabelFmt + `)`

	// Using kubernetes requirement, a valid key must be a non-empty string consist
	// of alphanumeric characters, '-', '_' or '.', and must start and end with an
	// alphanumeric character (e.g. 'MyValue',  or 'my_value',  or '12345'
	qualifiedNameFmt = "(?:[A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9]"

	// In Kubernetes, label names can start with a DNS name followed by a '/':
	dnsNamePrefixFmt       = dns1123LabelFmt + `(?:\.` + dns1123LabelFmt + `)*/`
	dnsNamePrefixMaxLength = 253
)

var (
	tagRegexp            = regexp.MustCompile("^(" + dnsNamePrefixFmt + ")?(" + qualifiedNameFmt + ")$") // label value can be an empty string
	labelValueRegexp     = regexp.MustCompile("^" + "(" + qualifiedNameFmt + ")?" + "$")
	dns1123LabelRegexp   = regexp.MustCompile("^" + dns1123LabelFmt + "$")
	wildcardPrefixRegexp = regexp.MustCompile("^" + wildcardPrefix + "$")
)

// IsDNS1123Label tests for a string that conforms to the definition of a label in
// DNS (RFC 1123).
func IsDNS1123Label(value string) bool {
	return len(value) <= DNS1123LabelMaxLength && dns1123LabelRegexp.MatchString(value)
}

// IsWildcardDNS1123Label tests for a string that conforms to the definition of a label in DNS (RFC 1123), but allows
// the wildcard label (`*`), and typical labels with a leading astrisk instead of alphabetic character (e.g. "*-foo")
func IsWildcardDNS1123Label(value string) bool {
	return len(value) <= DNS1123LabelMaxLength && wildcardPrefixRegexp.MatchString(value)
}

// ValidateWildcardDomain checks that a domain is a valid FQDN, but also allows wildcard prefixes.
func ValidateWildcardDomain(domain string) error {
	if err := checkDNS1123Preconditions(domain); err != nil {
		return err
	}
	// We only allow wildcards in the first label; split off the first label (parts[0]) from the rest of the host (parts[1])
	parts := strings.SplitN(domain, ".", 2)
	if !IsWildcardDNS1123Label(parts[0]) {
		return fmt.Errorf("domain name %q invalid (label %q invalid)", domain, parts[0])
	} else if len(parts) > 1 {
		return validateDNS1123Labels(parts[1])
	}
	return nil
}

// ValidateFQDN checks a fully-qualified domain name
func ValidateFQDN(fqdn string) error {
	if err := checkDNS1123Preconditions(fqdn); err != nil {
		return err
	}
	return validateDNS1123Labels(fqdn)
}

// encapsulates DNS 1123 checks common to both wildcarded hosts and FQDNs
func checkDNS1123Preconditions(name string) error {
	if len(name) > 255 {
		return fmt.Errorf("domain name %q too long (max 255)", name)
	}
	if len(name) == 0 {
		return fmt.Errorf("empty domain name not allowed")
	}
	return nil
}

func validateDNS1123Labels(domain string) error {
	parts := strings.Split(domain, ".")
	topLevelDomain := parts[len(parts)-1]
	if _, err := strconv.Atoi(topLevelDomain); err == nil {
		return fmt.Errorf("domain name %q invalid (top level domain %q cannot be all-numeric)", domain, topLevelDomain)
	}
	for i, label := range parts {
		// Allow the last part to be empty, for unambiguous names like `istio.io.`
		if i == len(parts)-1 && label == "" {
			return nil
		}
		if !IsDNS1123Label(label) {
			return fmt.Errorf("domain name %q invalid (label %q invalid)", domain, label)
		}
	}
	return nil
}

// ValidateIPSubnet checks that a string is in "CIDR notation" or "Dot-decimal notation"
func ValidateIPSubnet(subnet string) error {
	// We expect a string in "CIDR notation" or "Dot-decimal notation"
	// E.g., a.b.c.d/xx form or just a.b.c.d or 2001:1::1/64
	if strings.Count(subnet, "/") == 1 {
		// We expect a string in "CIDR notation", i.e. a.b.c.d/xx or 2001:1::1/64 form
		ip, _, err := net.ParseCIDR(subnet)
		if err != nil {
			return fmt.Errorf("%v is not a valid CIDR block", subnet)
		}
		if ip.To4() == nil && ip.To16() == nil {
			return fmt.Errorf("%v is not a valid IPv4 or IPv6 address", subnet)
		}
		return nil
	}
	return ValidateIPAddress(subnet)
}

// ValidateIPAddress validates that a string in "CIDR notation" or "Dot-decimal notation"
func ValidateIPAddress(addr string) error {
	ip := net.ParseIP(addr)
	if ip == nil {
		return fmt.Errorf("%v is not a valid IP", addr)
	}

	return nil
}
