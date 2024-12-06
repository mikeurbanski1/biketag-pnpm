import { Dayjs } from 'dayjs';
import React, { useState } from 'react';

import { isEarlierDate, Logger } from '@biketag/utils';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const logger = new Logger({ prefix: '[AddTag]' });

interface AddTagProps {
    saveTag: ({ name, contents }: { name: string; contents: string }) => void;
    isSubtag: boolean;
    // will be provided for a new root tag (if there is a previous root tag)
    // hacky workaround to allow testing of creating tags at different times
    previousRootTagDate?: Dayjs;
    dateOverride: Dayjs;
}

export const AddTag: React.FC<AddTagProps> = ({ saveTag, isSubtag, previousRootTagDate, dateOverride }) => {
    const [name, setName] = useState('');
    const [contents, setContents] = useState('');
    // const [date, setDate] = useState(dayjs().format('YYYY-MM-DDTHH:mm'));

    // const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    //     if (!event.target['validity'].valid || !dayjs(event.target.value).isValid()) return;
    //     setDate(event.target.value);
    // };

    const canPostOnDate = !previousRootTagDate || !isEarlierDate(dateOverride, previousRootTagDate);

    const canSave = contents.length > 0 && canPostOnDate && (isSubtag || name.length > 0);

    const className = isSubtag ? 'subtag' : 'main-tag';
    const nameElement = isSubtag ? undefined : (
        <div>
            <input key="name-input" placeholder="Where are you?" className="tag-title tag-input" type="text" name="name" onChange={(event) => setName(event.target.value)} value={name}></input>
        </div>
    );

    return (
        <div className={className}>
            {!isSubtag && nameElement}
            <div>
                <input type="text" placeholder="Add your tag" className="tag-contents tag-input" name="contents" onChange={(event) => setContents(event.target.value)} value={contents}></input>
            </div>
            <div>
                <input type="button" name="save-tag" value="Save" disabled={!canSave} onClick={() => saveTag({ name, contents })}></input>
            </div>
        </div>
    );
};
