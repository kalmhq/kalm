package resources

import (
	batchv1 "k8s.io/api/batch/v1"
	v1 "k8s.io/api/core/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type Job struct {
	Namespace         string `json:"namespace"`
	Name              string `json:"name"`
	CronJob           string `json:"cronJob"`
	Complete          bool   `json:"complete"`
	StartTimestamp    *int64 `json:"startTimestamp,omitempty"`
	CompleteTimestamp *int64 `json:"completeTimestamp,omitempty"`
}

func BuildJobFromResource(job *batchv1.Job) *Job {
	var cronJob string
	for _, ownerRef := range job.OwnerReferences {
		if ownerRef.Kind != "CronJob" {
			continue
		}

		cronJob = ownerRef.Name
		break
	}

	var complete bool
	for _, cond := range job.Status.Conditions {
		if cond.Type != batchv1.JobComplete {
			continue
		}

		complete = cond.Status == v1.ConditionTrue
	}

	var startTs int64
	if job.Status.StartTime != nil {
		startTs = job.Status.StartTime.Unix()
	}

	var compTs int64
	if job.Status.CompletionTime != nil {
		compTs = job.Status.CompletionTime.Unix()
	}

	return &Job{
		Namespace:         job.Namespace,
		Name:              job.Name,
		CronJob:           cronJob,
		Complete:          complete,
		StartTimestamp:    &startTs,
		CompleteTimestamp: &compTs,
	}
}

type JobListChannel struct {
	List  chan *batchv1.JobList
	Error chan error
}

func (resourceManager *ResourceManager) GetJobListChannel(opts ...client.ListOption) *JobListChannel {
	channel := &JobListChannel{
		List:  make(chan *batchv1.JobList, 1),
		Error: make(chan error, 1),
	}

	go func() {
		var list batchv1.JobList
		err := resourceManager.List(&list, opts...)
		channel.List <- &list
		channel.Error <- err
	}()

	return channel
}
