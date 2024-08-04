src = "./docker-compose.yml"
 

all:
	docker-compose -f ${src} up --build

noCache:
	docker-compose -f ${src} build --no-cache
down:
	docker-compose -f ${src} down
start:
	docker-compose -f ${src} start
stop:
	docker-compose -f ${src} stop	
clean:
	docker system prune 