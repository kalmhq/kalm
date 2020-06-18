package resources

import (
	coreV1 "k8s.io/api/core/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type SecretListChannel struct {
	List  chan []coreV1.Secret
	Error chan error
}

func (builder *Builder) GetSecretListChannel(namespace string, opts ...client.ListOption) *SecretListChannel {
	channel := &SecretListChannel{
		List:  make(chan []coreV1.Secret, 1),
		Error: make(chan error, 1),
	}

	go func() {
		var secretList coreV1.SecretList
		err := builder.List(&secretList, opts...)

		if err != nil {
			channel.List <- nil
			channel.Error <- err
			return
		}

		res := make([]coreV1.Secret, len(secretList.Items))

		for i, secret := range secretList.Items {
			res[i] = secret
		}

		channel.List <- res
		channel.Error <- err
	}()

	return channel
}

func (builder *Builder) GetSecret(ns, secName string) (coreV1.Secret, error) {
	sec := coreV1.Secret{}
	if err := builder.Get(ns, secName, &sec); err != nil {
		return coreV1.Secret{}, err
	}

	return sec, nil
}
