package resources

import (
	"gotest.tools/assert"
	"testing"
	"time"
)

var podMap1 = map[string]MetricsSum{
	"pod1": {
		CPUUsageHistory: []MetricPoint{
			{
				Timestamp: time.Unix(1, 0),
				Value:     1,
			},
		},
		MemoryUsageHistory: nil,
	},
	"pod2": {
		CPUUsageHistory: []MetricPoint{
			{
				Timestamp: time.Unix(1, 0),
				Value:     2,
			},
		},
		MemoryUsageHistory: nil,
	},
}

func TestAggregateMetrics(t *testing.T) {
	points := aggregateMetrics(podMap1, "cpu")

	assert.Equal(t, len(points), 1)
	assert.Equal(t, points[0].Value, uint64(3))
}

var podMap2 = map[string]MetricsSum{
	"pod1": {
		CPUUsageHistory: []MetricPoint{
			{
				Timestamp: time.Unix(1, 0),
				Value:     1,
			},
			{
				Timestamp: time.Unix(2, 0),
				Value:     2,
			},
		},
		MemoryUsageHistory: []MetricPoint{
			{
				Timestamp: time.Unix(99, 0),
				Value:     99,
			},
		},
	},
	"pod2": {
		CPUUsageHistory: []MetricPoint{
			{
				Timestamp: time.Unix(1, 0),
				Value:     2,
			},
			{
				Timestamp: time.Unix(3, 0),
				Value:     3,
			},
		},
		MemoryUsageHistory: nil,
	},
}

func TestAggregateMetrics2(t *testing.T) {
	points := aggregateMetrics(podMap2, "cpu")

	assert.Equal(t, len(points), 3)
	assert.Equal(t, points[0].Value, uint64(3))
	assert.Equal(t, points[1].Value, uint64(2))
	assert.Equal(t, points[2].Value, uint64(3))
}

func TestAggregatePodsSum(t *testing.T) {
	mSum := aggregatePodsSum(podMap2)

	assert.Equal(t, len(mSum.CPUUsageHistory), 3)
	assert.Equal(t, mSum.CPUUsageHistory[0].Value, uint64(3))
	assert.Equal(t, mSum.CPUUsageHistory[1].Value, uint64(2))
	assert.Equal(t, mSum.CPUUsageHistory[2].Value, uint64(3))

	assert.Equal(t, len(mSum.MemoryUsageHistory), 1)
	assert.Equal(t, mSum.MemoryUsageHistory[0].Value, uint64(99))
}
