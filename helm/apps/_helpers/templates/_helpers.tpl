{{- define "backend-app.labels"}}
app: myapp
type: backend
{{- end}}
{{- define "dapr.annotations"}}
dapr.io/enabled: "true"
dapr.io/app-id: {{ .Values.serviceName | quote }}
dapr.io/app-port: {{ .Values.port | quote }}
dapr.io/config: "dapr-config"
dapr.io/env-from-secret: "APP_API_TOKEN=dapr-api-token"
{{- end}}