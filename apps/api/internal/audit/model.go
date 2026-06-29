package audit

type RecordRequest struct {
	ActorUserID  string
	Action       string
	ResourceType string
	ResourceID   string
	Metadata     map[string]any
}
