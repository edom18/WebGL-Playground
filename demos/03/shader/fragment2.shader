precision mediump float;
uniform float time;
uniform vec2  mouse;
uniform vec2  resolution;

const float sphereSize = 1.0;
const float PI    = 3.14159265359;
const float DEG_TO_RAD = PI / 180.0;
const float angle = 60.0;
const float fov   = angle * 0.5 * DEG_TO_RAD;
const vec3  lightPos = vec3(-0.5777, 0.5777, 0.5777);

float distanceFunc(vec3 position) {
    return length(position) - sphereSize;
}

vec3 getNormal(vec3 position) {
    // 差分
    const float d = 0.0001;
    return normalize(vec3(
        distanceFunc(position + vec3(  d, 0.0, 0.0)) - distanceFunc(position + vec3( -d, 0.0, 0.0)),
        distanceFunc(position + vec3(0.0,   d, 0.0)) - distanceFunc(position + vec3(0.0,  -d, 0.0)),
        distanceFunc(position + vec3(0.0, 0.0,   d)) - distanceFunc(position + vec3(0.0, 0.0,  -d))
    ));
}

void main() {
    vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);

    // Camera
    // vec3 cPos = vec3(0.0, 0.0, 2.0);
    vec3 cPos = vec3(mouse.xy, 2.0);
    float targetDepth = 1.0;

    // Ray
    vec3 ray = normalize(vec3(sin(fov) * p.x, sin(fov) * p.y, -cos(fov)));

    // Marching loop
    float distance = 0.0;
    float rLen = 0.0;
    vec3 rPos = cPos;

    for (int i = 0; i < 16; i++) {
        distance = distanceFunc(rPos);
        rLen += distance;
        rPos = cPos + ray * rLen;
    }

    if (abs(distance) < 0.001) {
        float diffuse = clamp(dot(getNormal(rPos), lightPos), 0.1, 1.0);
        gl_FragColor = vec4(vec3(1.0), 1.0) * vec4(vec3(diffuse), 1.0);
    }
    else {
        gl_FragColor = vec4(vec3(0.0), 1.0);
    }
}
