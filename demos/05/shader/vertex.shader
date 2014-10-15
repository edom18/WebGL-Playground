attribute vec3 position;
attribute vec4 color;
attribute vec3 normal;

varying vec4 vColor;

uniform mat4 MATRIX_MVP;

vec3 lightPos = normalize(vec3(1.0, 1.0, 1.0));

void main(void){
    float diff = clamp(dot(normal, lightPos), 0.0, 1.0);
    vColor = color * vec4(diff, diff, diff, 1.0);

    gl_Position = MATRIX_MVP * vec4(position, 1.0);
}
