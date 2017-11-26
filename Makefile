.PHONY: all buildfrontend buildbackend preparefrontend update clean mrproper docker preparedocker rebuildsearch

all: buildfrontend buildbackend rebuildsearch

buildfrontend: preparefrontend
	npm run build

buildbackend:
	go build -o walkhub cmd/walkhub/main.go

preparefrontend:
	npm install
	mkdir -p public
	mkdir -p assets

update:
	npm update

clean:
	rm assets/*
	[ ! -e walkhub ] || rm ./walkhub
	rm -r dist

mrproper: clean
	rm -r node_modules

preparedocker: all
	mkdir -p dist
	cp walkhub dist
	cp wh-rebuildsearch dist
	cp config.json dist
	cp -R assets dist
	cp -R public dist
	cp Dockerfile dist

docker: preparedocker
	cd dist && docker build -t pronovix/walkhub-service .

rebuildsearch:
	go build -o wh-rebuildsearch cmd/wh-rebuildsearch/main.go

gettext:
	python gettext.py
	msgmerge -U locales/en.po locales/messages.pot
	msgmerge -U locales/fr.po locales/messages.pot
	npm run stonejs -- build --merge locales/*.po js/messages.json
