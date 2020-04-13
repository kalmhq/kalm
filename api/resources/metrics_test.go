package resources

import (
	"gotest.tools/assert"
	"testing"
	"time"
)

var podMap1 = map[string]MetricHistories{
	"pod1": {
		CPU: []MetricPoint{
			{
				Timestamp: time.Unix(1, 0),
				Value:     1,
			},
		},
		Memory: nil,
	},
	"pod2": {
		CPU: []MetricPoint{
			{
				Timestamp: time.Unix(1, 0),
				Value:     2,
			},
		},
		Memory: nil,
	},
}

func TestAggregateMetrics(t *testing.T) {
	points := aggregateMapOfPod2Metrics(podMap1, "cpu")

	assert.Equal(t, len(points), 1)
	assert.Equal(t, points[0].Value, uint64(3))
}

var podMap2 = map[string]MetricHistories{
	"pod1": {
		CPU: []MetricPoint{
			{
				Timestamp: time.Unix(1, 0),
				Value:     1,
			},
			{
				Timestamp: time.Unix(2, 0),
				Value:     2,
			},
		},
		Memory: []MetricPoint{
			{
				Timestamp: time.Unix(99, 0),
				Value:     99,
			},
		},
	},
	"pod2": {
		CPU: []MetricPoint{
			{
				Timestamp: time.Unix(1, 0),
				Value:     2,
			},
			{
				Timestamp: time.Unix(3, 0),
				Value:     3,
			},
		},
		Memory: nil,
	},
}

func TestAggregateMetrics2(t *testing.T) {
	points := aggregateMapOfPod2Metrics(podMap2, "cpu")

	assert.Equal(t, len(points), 3)
	assert.Equal(t, points[0].Value, uint64(3))
	assert.Equal(t, points[1].Value, uint64(2))
	assert.Equal(t, points[2].Value, uint64(3))
}

func TestAggregatePodsSum(t *testing.T) {
	mSum := aggregatePodsSum(podMap2)

	assert.Equal(t, len(mSum.CPU), 3)
	assert.Equal(t, mSum.CPU[0].Value, uint64(3))
	assert.Equal(t, mSum.CPU[1].Value, uint64(2))
	assert.Equal(t, mSum.CPU[2].Value, uint64(3))

	assert.Equal(t, len(mSum.Memory), 1)
	assert.Equal(t, mSum.Memory[0].Value, uint64(99))
}

var podMap3 = map[string]MetricHistories{
	"pod1": {
		CPU: []MetricPoint{
			{
				Timestamp: time.Unix(5, 0),
				Value:     1,
			},
		},
		Memory: []MetricPoint{
			{
				Timestamp: time.Unix(99, 0),
				Value:     99,
			},
		},
	},
	"pod2": {
		CPU: []MetricPoint{
			{
				Timestamp: time.Unix(1, 0),
				Value:     2,
			},
			{
				Timestamp: time.Unix(3, 0),
				Value:     3,
			},
			{
				Timestamp: time.Unix(5, 0),
				Value:     5,
			},
		},
		Memory: nil,
	},
}

func TestAggregatePodsSum2(t *testing.T) {
	mSum := aggregatePodsSum(podMap3)

	//fmt.Println("cpu", mSum.CPU)
	assert.Equal(t, len(mSum.CPU), 3)
	assert.Equal(t, mSum.CPU[0].Value, uint64(2))
	assert.Equal(t, mSum.CPU[1].Value, uint64(3))
	assert.Equal(t, mSum.CPU[2].Value, uint64(6))
}
