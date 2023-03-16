CWD := $(shell pwd)

FILES := $(wildcard *.ts)
O_FILES := $(addsuffix .js,$(basename $(FILES)))

%.js :: %.ts
	npx detype $< $@

$(O_FILES): $(FILES)


clean:
	rm -f ./*.js
	cd $(CWD)/PlaybackRateMenu && $(MAKE) clean

detyped: $(O_FILES)
	cd $(CWD)/PlaybackRateMenu && $(MAKE) detyped

.PHONY: detyped clean
