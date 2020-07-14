package resources

import (
	"encoding/json"
	"sort"
	"time"
)

// https://github.com/kubernetes/dashboard/blob/master/src/app/backend/integration/metric/api/types.go#L121
type MetricPoint struct {
	Timestamp time.Time
	Value     float64
}

type MetricHistory []MetricPoint

func (m *MetricPoint) MarshalJSON() ([]byte, error) {
	return json.Marshal(map[string]interface{}{
		"x": m.Timestamp.Unix() * 1000,
		"y": m.Value,
	})
}

type MetricHistories struct {
	IsMetricServerEnabled bool          `json:"isMetricServerEnabled"`
	CPU                   MetricHistory `json:"cpu"`
	Memory                MetricHistory `json:"memory"`
}

func mergeMetricHistories(a, b MetricHistory) (rst MetricHistory) {
	sortMetricHistory(a)
	sortMetricHistory(b)

	i := 0
	j := 0
	for i < len(a) && j < len(b) {
		eleA := a[i]
		eleB := b[j]

		if eleA.Timestamp.Unix() == eleB.Timestamp.Unix() {
			rst = append(rst, MetricPoint{
				Timestamp: eleA.Timestamp,
				Value:     eleA.Value + eleB.Value,
			})

			i++
			j++
		} else if eleA.Timestamp.Unix() < eleB.Timestamp.Unix() {
			rst = append(rst, eleA)
			i++
		} else {
			rst = append(rst, eleB)
			j++
		}
	}

	rst = append(rst, a[i:]...)
	rst = append(rst, b[j:]...)

	return rst
}

func sortMetricHistory(a MetricHistory) {
	sort.Slice(a, func(i, j int) bool {
		return a[i].Timestamp.Unix() < a[j].Timestamp.Unix()
	})
}
