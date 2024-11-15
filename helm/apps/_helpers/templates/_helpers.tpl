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
{{- toYaml .Values.envRaw | nindent 2 -}}
{{ end }}
{{- end -}}
