variable "REGISTRY" {
    default = "harbor.sun-asterisk.vn"
}

variable "PREFIX" {
    default = "sai-poc/meeting-trans"
}

variable "TAG" {
    default = "latest"
}

variable "TAGS" {
    default = TAG
}

variable "SUPABASE_URL" {
    default = ""
}

variable "SUPABASE_PUBLISHABLE_KEY" {
    default = ""
}

variable "APP_DOMAIN" {
    default = ""
}

target "docker-metadata-action" {}

target "_common" {
    tags   = coalesce(target.docker-metadata-action.tags, split(",", TAGS))
    labels = target.docker-metadata-action.labels

    context = "."
}

target "web" {
    inherits   = ["_common"]
    dockerfile = "deploy/containers/web/Dockerfile"
    tags       = format_tags("web", target._common.tags)

    args = {
        NEXT_PUBLIC_REALTIME_TRANSCRIBE_ENDPOINT = "wss://${APP_DOMAIN}/realtime"
        NEXT_PUBLIC_SUPABASE_URL = "${SUPABASE_URL}"
        NEXT_PUBLIC_SUPABASE_ANON_KEY = "${SUPABASE_PUBLISHABLE_KEY}"
    }

    labels = {
        "org.opencontainers.image.description" = "Meeting translation web application"
    }
}

target "realtime" {
    inherits   = ["_common"]
    dockerfile = "deploy/containers/realtime/Dockerfile"
    tags       = format_tags("realtime", target._common.tags)

    labels = {
        "org.opencontainers.image.description" = "Meeting translation real-time ws server"
    }
}

group "default" {
    targets = ["web", "realtime"]
}

function "format_tags" {
    params = [component, tags]
    result = formatlist("${REGISTRY}/${PREFIX}/%s:%s", component, tags)
}
