FROM alfg/nginx-rtmp

COPY nginx/rtmp.conf /etc/nginx/nginx.conf

COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

RUN mkdir -p /tmp/hls

EXPOSE 1935

EXPOSE 80
