import os
import re


HEADER = r"""# SOME DESCRIPTIVE TITLE.
# Copyright (C) YEAR THE PACKAGE'S COPYRIGHT HOLDER
# This file is distributed under the same license as the PACKAGE package.
# FIRST AUTHOR <EMAIL@ADDRESS>, YEAR.
#
#, fuzzy
msgid ""
msgstr ""
"Project-Id-Version: PACKAGE VERSION\n"
"Report-Msgid-Bugs-To: \n"
"POT-Creation-Date: 2017-07-20 17:40+0200\n"
"PO-Revision-Date: YEAR-MO-DA HO:MI+ZONE\n"
"Last-Translator: FULL NAME <EMAIL@ADDRESS>\n"
"Language-Team: LANGUAGE <LL@li.org>\n"
"Language: \n"
"MIME-Version: 1.0\n"
"Content-Type: text/plain; charset=CHARSET\n"
"Content-Transfer-Encoding: 8bit\n"
"""


if __name__ == '__main__':
    rexp = re.compile('(\W|^)t\("(.*)"\)')

    pot = open('locales/locale.pot', 'w')
    pot.write(HEADER)
    for root, dirs, files in os.walk('js'):
        for filename in files:
            if filename.endswith('.js'):
                filename = os.path.join(root, filename)
                for line in open(filename):
                    for match in rexp.finditer(line):
                        pot.write('\nmsgid "{}"\nmsgstr ""\n'.format(match.group(2)))
