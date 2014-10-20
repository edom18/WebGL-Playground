attribute vec3 position;
attribute vec4 color;
attribute vec3 normal;
attribute vec2 textureCoord;

varying vec4 vColor;

uniform mat4 MATRIX_INV_M;
uniform mat4 MATRIX_MVP;
uniform sampler2D texture;

vec3 lightPos = normalize(vec3(1.0, 1.0, -1.0));

void main(void){
    vec3 wnormal = normalize(vec4(normal, 1.0) * MATRIX_INV_M).xyz;
    float diff = clamp(dot(wnormal, lightPos), 0.0, 1.0);
    vec4 diffuse = vec4(diff, diff, diff, 1.0);
    vColor = color * diffuse;
    /*vColor = texture2D(texture, textureCoord) * diffuse;*/

    gl_Position = MATRIX_MVP * vec4(position, 1.0);
}
