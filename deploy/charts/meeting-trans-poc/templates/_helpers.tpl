{{/*
Return the proper image name
{{ include "meeting-trans-poc.image" ( dict "imageRoot" .Values.path.to.the.image "global" .Values.global ) }}
*/}}
{{- define "meeting-trans-poc.image" -}}
{{- $registryName := .imageRoot.registry | default .global.imageRegistry | default "" -}}
{{- $repositoryName := .imageRoot.repository -}}
{{- $tag := .imageRoot.tag | default "latest" | toString -}}
{{- if $registryName }}
{{- printf "%s/%s:%s" $registryName $repositoryName $tag -}}
{{- else -}}
{{- printf "%s:%s" $repositoryName $tag -}}
{{- end -}}
{{- end -}}

{{/*
Web app name
*/}}
{{- define "meeting-trans-poc.web.name" -}}
{{- printf "%s-web" (include "common.names.fullname" .) }}
{{- end }}

{{/*
Web app labels
*/}}
{{- define "meeting-trans-poc.web.labels" -}}
{{ include "common.labels.standard" ( dict "customLabels" .Values.commonLabels "context" . ) }}
app.kubernetes.io/component: web
{{- end }}

{{/*
Web app selector labels
*/}}
{{- define "meeting-trans-poc.web.selectorLabels" -}}
{{ include "common.labels.matchLabels" ( dict "customLabels" .Values.commonLabels "context" . ) }}
app.kubernetes.io/component: web
{{- end }}

{{/*
Realtime app name
*/}}
{{- define "meeting-trans-poc.realtime.name" -}}
{{- printf "%s-realtime" (include "common.names.fullname" .) }}
{{- end }}

{{/*
Realtime app labels
*/}}
{{- define "meeting-trans-poc.realtime.labels" -}}
{{ include "common.labels.standard" ( dict "customLabels" .Values.commonLabels "context" . ) }}
app.kubernetes.io/component: realtime
{{- end }}

{{/*
Realtime app selector labels
*/}}
{{- define "meeting-trans-poc.realtime.selectorLabels" -}}
{{ include "common.labels.matchLabels" ( dict "customLabels" .Values.commonLabels "context" . ) }}
app.kubernetes.io/component: realtime
{{- end }}

{{/*
Secret name
*/}}
{{- define "meeting-trans-poc.secretName" -}}
{{- if .Values.secrets.existingSecret }}
{{- .Values.secrets.existingSecret }}
{{- else }}
{{- include "common.names.fullname" . }}
{{- end }}
{{- end }}
