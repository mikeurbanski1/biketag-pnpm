import { isEarlierDate, Logger } from '@biketag/utils';
import { Dayjs } from 'dayjs';
import React, { useState } from 'react';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const logger = new Logger({ prefix: '[AddTag]' });

interface AddTagProps {
    saveTag: ({ name, contents }: { name: string; contents: string }) => void;
    cancelAddTag: () => void;
    isRootTag: boolean;
    // will be provided for a new root tag (if there is a previous root tag)
    // hacky workaround to allow testing of creating tags at different times
    previousRootTagDate?: Dayjs;
    dateOverride: Dayjs;
}

export const AddTag: React.FC<AddTagProps> = ({ saveTag, cancelAddTag, isRootTag, previousRootTagDate, dateOverride }) => {
    const [name, setName] = useState('');
    const [contents, setContents] = useState('');
    // const [date, setDate] = useState(dayjs().format('YYYY-MM-DDTHH:mm'));

    // const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    //     if (!event.target['validity'].valid || !dayjs(event.target.value).isValid()) return;
    //     setDate(event.target.value);
    // };

    const canPostOnDate = !previousRootTagDate || !isEarlierDate(dateOverride, previousRootTagDate);

    const canSave = contents.length > 0 && canPostOnDate && (!isRootTag || name.length > 0);

    const locationElements = isRootTag
        ? [
              <label key="name" htmlFor="name">
                  Location name:{' '}
              </label>,
              <input key="name-input" type="text" name="name" onChange={(event) => setName(event.target.value)} value={name}></input>,
              <br key="br"></br>
          ]
        : undefined;

    return (
        <div className="add-root-tag">
            {locationElements}
            <label htmlFor="contents">Your tag: </label>
            <input type="text" name="contents" onChange={(event) => setContents(event.target.value)} value={contents}></input>
            {/* <br></br>
            <input aria-label="Date and time" type="datetime-local" defaultValue={date} onChange={handleDateChange} /> */}
            <br></br>
            <input type="button" name="save-tag" value="Save" disabled={!canSave} onClick={() => saveTag({ name, contents })}></input>
            <input type="button" name="cancel-tag" value="Cancel" onClick={() => cancelAddTag()}></input>
        </div>
    );
};
