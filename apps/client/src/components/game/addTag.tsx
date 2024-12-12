import { Dayjs } from 'dayjs';
import React, { useState } from 'react';

import { isEarlierDate, Logger } from '@biketag/utils';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const logger = new Logger({ prefix: '[AddTag]' });

interface AddTagProps {
    saveTag: ({ imageUrl }: { imageUrl: string }) => void;
    isSubtag: boolean;
    // will be provided for a new root tag (if there is a previous root tag)
    // hacky workaround to allow testing of creating tags at different times
    previousRootTagDate?: Dayjs;
    dateOverride: Dayjs;
    setAddTagAsActive: () => void;
    isActive: boolean;
}

export const AddTag: React.FC<AddTagProps> = ({ saveTag, previousRootTagDate, dateOverride, isSubtag, setAddTagAsActive, isActive }) => {
    const [imageUrl, setImageUrl] = useState('');
    // const [date, setDate] = useState(dayjs().format('YYYY-MM-DDTHH:mm'));

    // const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    //     if (!event.target['validity'].valid || !dayjs(event.target.value).isValid()) return;
    //     setDate(event.target.value);
    // };

    const canPostOnDate = !previousRootTagDate || !isEarlierDate(dateOverride, previousRootTagDate);

    const canSave = imageUrl.length > 0 && canPostOnDate;

    const className = isSubtag ? 'subtag' : 'main-tag';

    return (
        <div className={`${isActive ? className : 'minimal-tag'} add-tag`} onClick={setAddTagAsActive}>
            <div>
                <input type="text" placeholder="Image URL" className="tag-input" name="contents" onChange={(event) => setImageUrl(event.target.value)} value={imageUrl}></input>
            </div>
            <div>
                <input type="button" name="save-tag" value="Save" disabled={!canSave} onClick={() => saveTag({ imageUrl })}></input>
            </div>
        </div>
    );
};
