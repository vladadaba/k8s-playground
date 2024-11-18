{{- define "backend-app.labels"}}
app: myapp
type: backend
{{- end}}
{{- define "env" }}
{{- if or (.Values.env) (.Values.envRaw)}}
env:
{{- range $k,$v := .Values.env }}
  - name: {{ $k }}
    value: {{ $v | quote}}
{{- end }}
{{ with .Values.envRaw }}
{{- toYaml . | nindent 2 -}}
{{ end }}
{{ end }}
{{- end -}}
